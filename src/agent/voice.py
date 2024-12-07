import requests
import os

# Replace these with your actual Twilio credentials
account_sid = os.getenv('TWILIO_ACCOUNT_SID') 
auth_token = os.getenv('GROQ_API_KEY')
media_url = os.getenv('TWILIO_MEDIA_URL')

# Authenticate and download the file
response = requests.get(media_url, auth=(account_sid, auth_token))

if response.status_code == 200:
    with open("voice_message.ogg", "wb") as f:
        f.write(response.content)
    print("File downloaded successfully!")
else:
    print(f"Failed to download file. Status code: {response.status_code}")
    print(response.text)  # Log the error details
