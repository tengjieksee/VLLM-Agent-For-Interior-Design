# multi_agent.py
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any, Tuple
import os
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_groq import ChatGroq
from pinecone import Pinecone
from docx import Document
import docx2txt


os.environ["PINECONE_DEFAULT_API_KEY"] = os.getenv("PINECONE_DEFAULT_API_KEY")




from fastmcp import FastMCP

mcp = FastMCP("MCP for Interior Design AI")


def extract_and_chunk_texts(folder_path, extensions=['.txt', '.doc', '.docx'], chunk_size=500):
    """
    Extract text from files in a folder, clean it, and split into word chunks.
    
    Args:
        folder_path (str): Path to the folder containing files.
        extensions (list): List of file extensions to process.
        chunk_size (int): Number of words per chunk.
        
    Returns:
        list: A list of text chunks from all files.
    """
    all_chunks = []

    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        ext = os.path.splitext(filename)[1].lower()
        
        if not os.path.isfile(file_path) or ext not in extensions:
            continue
        
        # Extract text
        if ext == '.txt':
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                text = f.read()
        elif ext == '.docx':
            doc = Document(file_path)
            text = '\n'.join([para.text for para in doc.paragraphs])
        elif ext == '.doc':
            text = docx2txt.process(file_path)
        
        # Clean text
        text = ' '.join(text.split())  # removes extra whitespace, tabs, line breaks
        if not text:
            continue
        
        # Chunk text
        words = text.split()
        chunks = [' '.join(words[i:i+chunk_size]) for i in range(0, len(words), chunk_size)]
        all_chunks.extend([chunk for chunk in chunks if chunk.strip()])
    
    return all_chunks


@mcp.tool
def retrieve_related_text(query_text = "", index_name = "llama-text-embed-v2-index", folder_path = "./uploads/", extensions = ['.txt', '.doc', '.docx'], namespace="example-namespace"):
    try:
        pc = Pinecone(api_key=os.environ["PINECONE_DEFAULT_API_KEY"])
        
        index = pc.Index(index_name)
        
        
        files_in_folder = os.listdir(folder_path)
        found_files = [f for f in files_in_folder if os.path.splitext(f)[1].lower() in extensions]

        if len(found_files) > 0:
            chunks = extract_and_chunk_texts(folder_path, chunk_size=500)
            print(f"Total chunks created: {len(chunks)}")
            data_dict = []
            for id_0, txt_0 in enumerate(chunks):
                entry_0 = {"id": f"vec{int(id_0+1)}", "text": txt_0}
                data_dict.append(entry_0)
            index.upsert_records(namespace=namespace, records=data_dict)
        else:
            pass
        #convert docs into text
        #make chunks of all text of 500 words in each chunk
        #upload text to Pinecone
        #delete the docs
        
        results = index.search(namespace=namespace,query={"inputs": {"text": query_text},"top_k": 3})
    
    except:
        results = ""
    
    return results







if __name__ == "__main__":
    # Use HTTP so LLM agents can connect remotely
    mcp.run(transport="http", port=8001)
#python demo_mcp_server.py
#or
#fastmcp run calculator_server.py:mcp --transport http --port 8000
