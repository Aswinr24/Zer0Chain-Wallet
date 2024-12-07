import os
import requests
from flask import Flask, request, jsonify
from twilio.twiml.messaging_response import MessagingResponse
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from cdp import wallet,transaction, hash_typed_data_message
from cdp.payload_signature import PayloadSignature
from cdp_langchain.agent_toolkits import CdpToolkit
from cdp_langchain.utils import CdpAgentkitWrapper
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import HumanMessage
from dotenv import load_dotenv
import librosa
import json
import re
import soundfile as sf


load_dotenv()


GROQ_API_KEY = os.getenv('GROQ_API_KEY')
account_sid = os.getenv('TWILIO_ACCOUNT_SID') 
auth_token= os.getenv('TWILIO_AUTH_TOKEN')
HF_API_KEY = os.getenv('HF_API_KEY')
GOOGLE_API_KEY2 = os.getenv('GOOGLE_API_KEY2')


# Initialize the LLM with Gemini
llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro")  

# Initialize CDP AgentKit wrapper
cdp = CdpAgentkitWrapper()

# Create toolkit from wrapper
cdp_toolkit = CdpToolkit.from_cdp_agentkit_wrapper(cdp)

# Get all available tools
tools = cdp_toolkit.get_tools()

# Create the agent
agent_executor = create_react_agent(
    llm,
    tools=tools,
    state_modifier="You are a helpful agent that can interact with the Base blockchain using CDP AgentKit. You can create wallets, deploy tokens, and perform transactions."
)

# Initialize a lightweight LLM for preliminary analysis
preliminary_llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro", api_key=GOOGLE_API_KEY2)  

# Function to extract parameters from the query
def extract_parameters(query: str):
    prompt = f"""
You are a helpful assistant. Extract the parameters from the following query and format them into a JSON object. 
Query: "{query}"
The parameters may include:
- `amount`: the amount to transfer
- `to`: the recipient address
- `currency`: the type of currency (e.g., ETH, BTC)
- `chain`: the blockchain (if specified)
If any field is not mentioned, omit it in the JSON.
Return only the JSON object.
"""
    # Pass the prompt as a single HumanMessage
    response = preliminary_llm([HumanMessage(content=prompt)])
    raw_content = response.content.strip()
        # Extract the JSON object using regex
    try:
        json_match = re.search(r"\{.*?\}", raw_content, re.DOTALL)
        if json_match:
            json_content = json_match.group(0)  # Extract matched JSON string
            params = json.loads(json_content)  # Parse JSON
            return params
        else:
            raise ValueError("No JSON object found in the response.")
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Error parsing JSON: {e}")
        print(f"Raw LLM response: {raw_content}")
        return None

def speech_enchancer(question: str)->str:
    prompt=f"This is a speech converted to text from an open source ai model, this is mostly spoken by an Indian person so accordingly understand and interprest the words and also all the speech instructions are given to a crypto ai agent so relate the words to web3 ecosystem as well and return the enchanced version of the text from speec which is easily interpreted by the crypto ai agent, Just return the json with the enchanched speech as field `speech' in the json also ensure it is as the same length of the user's speech, just provide the json alone nothing else no prefix no ending, only plain json with the enchanced speech parameter which should be of the same length as the input speech remember!: {question}"
    response = preliminary_llm([HumanMessage(content=prompt)])
    print(response.content)
    try: 
        return response.content # Extract speech from the response
    
    except Exception as e:
         print(f"Error during speech enhancement: {str(e)}")
         return '{"speech": "Error enhancing speech."}'

def is_monetary_action_using_llm(question: str) -> bool:
    prompt = f"Classify the following query into monetary or non-monetary transaction or request taking into consideration the web3 ecosystem as well: {question}"
    response = preliminary_llm([HumanMessage(content=prompt)])
    
    # Example response analysis
    
    if "monetary" in response.lower():
        return True
    return False

def sign_transaction(transaction_data):
    # Assuming transaction_data contains the necessary data to sign the transaction
    # Create the transaction payload here
    typed_data_message_hash = hash_typed_data_message(transaction_data).wait()

    payload_signature = wallet.sign_payload(typed_data_message_hash).wait()
    return payload_signature

# Function to interact with the agent
def ask_agent(question: str):
    response_text = ""
    for chunk in agent_executor.stream(
        {"messages": [HumanMessage(content=question)]},
        {"configurable": {"thread_id": "my_first_agent"}}
    ):
        if "agent" in chunk:
            response_text = chunk["agent"]["messages"][0].content
        elif "tools" in chunk:
            response_text = chunk["tools"]["messages"][0].content
        print("-------------------")
    return response_text


# Function to download media files (voice or otherwise)
def download_media(media_url):
    response = requests.get(media_url)
    file_name = "voice_message.ogg"  # Default to OGG format
    file_path = os.path.join(os.getcwd(), file_name)
    with open(file_path, "wb") as f:
        f.write(response.content)
    return file_path

def convert_to_wav(input_file, output_file):
    data, samplerate = librosa.load(input_file, sr=16000)  # Load with 16kHz sampling
    sf.write(output_file, data, samplerate)
    print(f"Converted {input_file} to {output_file}")

API_URL = "https://api-inference.huggingface.co/models/facebook/wav2vec2-large-960h-lv60-self"
headers = {"Authorization": f"Bearer {HF_API_KEY}"}

def transcribe_with_huggingface(audio_file):
    with open(audio_file, "rb") as f:
        data=f.read()
        response = requests.post(API_URL, headers=headers, data=data)
    return response.json() 

def litInvoke(params):
    if float(params["amount"]) > 0.0001:
        amount_in_eth = params.get("amount")
        wallet = cdp.export_wallet()
        wallet_dict = json.loads(wallet)
        # Extract wallet_id and seed
        wallet_info = {
            "walletId": wallet_dict.get("wallet_id"),
            "seed": wallet_dict.get("seed")
        }
        # Extract the address from the parsed wallet object
        address = wallet_dict.get("default_address_id")
        if not address:
            raise ValueError("Address not found in wallet data.")
        
        values = {
            "wallet": wallet_info,
            "address": address,
        }
        print(values)
        api_url = "http://localhost:8000/api/lit/trigger-lit-action"

        response = requests.post(api_url, json=values)
        if response.status_code == 200:
            return jsonify({"success": True, "message": "Transaction Triggered"})
        else:
            return jsonify({"success": False, "message": "Failed to Trigger Lit Action"})
    else:
        return

# Set up Flask for WhatsApp integration
app = Flask(__name__)

@app.route('/sign_transaction', methods=['POST'])
def sign_transaction():
    data = request.json
    unsigned_transaction = data.get("unsignedTransaction")
    hex_signature = data.get("hexSignature")

    # You will need to validate the incoming data here
    
    # Step 1: Recover the signing address (optional but useful for verification)
    recovered_address = wallet.recover_address(unsigned_transaction, hex_signature)
    
    # Step 2: Sign the transaction using the Coinbase Wallet (here, assuming the wallet is unlocked)
    signed_tx = wallet.sign_transaction(unsigned_transaction, hex_signature)

    # Step 3: Return the signed transaction to Node.js for sending to Ethereum network
    return jsonify({"success": True, "signedTx": signed_tx})

@app.route('/webhook', methods=['POST'])
def webhook():
    # Get the incoming message from WhatsApp
    incoming_msg = request.values.get('Body', '').strip()
    phone_number = request.values.get('From', '')
    media_url = request.values.get('MediaUrl0')  # Twilio sends media URLs
    media_type = request.values.get('MediaContentType0')  # Media type
    message_sid = request.values.get('MessageSid')
    print(media_url, message_sid)


    # Create a response object
    resp = MessagingResponse()
    msg = resp.message()

    # Check if there's a media message and if it's audio
    if media_url and "audio" in media_type:
        # Download the voice message
        file_path = download_media(media_url)
        # msg.body(f"Voice message received and saved as {file_path}. Processing...")

        # Authenticate and download the file
        response = requests.get(media_url, auth=(account_sid, auth_token))

        if response.status_code == 200:
            with open(file_path, "wb") as f:
                f.write(response.content)
            print("File downloaded successfully!")
        else:
            print(f"Failed to download file. Status code: {response.status_code}")
            print(response.text)  # Log the error details

        convert_to_wav(file_path, "voice_message.wav")
        result = transcribe_with_huggingface("voice_message.wav")

        # Extract the text value from the dictionary
        transcribed_text = result.get("text", "")

        # Check if transcribed_text is a valid string before passing it
        if transcribed_text:
            print("Transcription:", transcribed_text)
            # speech = speech_enchancer(transcribed_text)
            # speech2=json.loads(speech)
            response = ask_agent(transcribed_text)  # Pass the transcribed text directly to the agent
        else:
            print("Failed to transcribe or no text found.")

        msg.body(response)  # Send back the response to the user via WhatsApp
        print(str(resp))

        try:
            os.remove("voice_message.ogg")
            os.remove("voice_message.wav")
            print("Audio files deleted successfully.")
        except Exception as e:
            print(f"Error deleting files: {e}")
        
        return str(resp)

    # Process the incoming message with the preliminary LLM
    if incoming_msg.lower() == 'exit':
        msg.body("Goodbye!")
        return str(resp)

    # Extract parameters using the preliminary LLM
    params = extract_parameters(incoming_msg)
    # Check if 'amount' exists and proceed only if it does
    if "amount" in params:
        print(params)
        # Ensure the value is a valid number and check the threshold
        if float(params["amount"]) > 1:
            msg.body("Crossed threshold limit! Invoking Lit Action")
            litRes = litInvoke(params)
            print(litRes)


    # if(is_monetary_action_using_llm){

    # }
    
    # # Log the extracted parameters for debugging
    # print("Extracted Parameters:", params)
    print(incoming_msg)
    response = ask_agent(incoming_msg)  # Ask the agent
    msg.body(response)  # Send back the response to the user via WhatsApp
    print(str(resp))

    return str(resp)

if __name__ == '__main__':
    app.run(debug=True)
