import os

ak = os.getenv("VOLC_ACCESSKEY", "")
sk = os.getenv("VOLC_SECRETKEY", "")
collection_name = os.getenv("COLLECTION_NAME", "")
faq_collection_name = os.getenv("FAQ_COLLECTION_NAME", "")
endpoint_id = os.getenv("LLM_ENDPOINT_ID", "doubao-1-5-pro-32k-250115")
bucket_name = os.getenv("BUCKET_NAME", "")
use_server_auth = os.getenv("USE_SERVER_AUTH", "False").lower() in ("true", "1", "t")
