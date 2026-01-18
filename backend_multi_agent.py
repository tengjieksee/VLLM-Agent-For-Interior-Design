# multi_agent.py
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any, Tuple
import os
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_groq import ChatGroq
from pinecone import Pinecone

#python -m uvicorn backend_multi_agent:app --host 0.0.0.0 --port 8000 --reload 
#node server.js

import asyncio
from fastmcp import Client

client = Client("http://localhost:8001/mcp")

# Load environment variables
load_dotenv()
os.environ["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY")
os.environ["PINECONE_DEFAULT_API_KEY"] = os.getenv("PINECONE_DEFAULT_API_KEY")

# Initialize LLM
llm = ChatGroq(
    model="qwen/qwen3-32b",
    temperature=0.2,
    max_tokens=2048,
    timeout=30,
    max_retries=3,
)

app = FastAPI()

class QueryRequest(BaseModel):
    query: str
    conversation: List[Dict[str, str]] = []


def format_conversation_history(conversation: List[Dict[str, str]]) -> str:
    """Convert conversation history to readable format"""
    if not conversation:
        return "No prior conversation"
    formatted = []
    for msg in conversation:
        role = "User" if msg["role"] == "user" else "Assistant"
        formatted.append(f"{role}: {msg['content']}")
    return "\n".join(formatted)


def router_agent(current_query: str, conversation_history: str) -> str:
    """Route to reasoning or casual path"""
    messages = [
        SystemMessage(content=(
            "You are an expert conversation router for an interior design assistant. Analyze the user's latest message and context:\n"
            "- Respond 'reasoning' if the query requires calculations, design analysis, measurements, or multi-step problem solving\n"
            "- Respond 'casual' for greetings, compliments, simple questions, or conversational messages\n"
            "Consider conversation history for context. Respond ONLY with 'reasoning' or 'casual'."
        )),
        HumanMessage(content=(
            f"Conversation History:\n{conversation_history}\n\n"
            f"Latest User Message: {current_query}"
        ))
    ]
    response = llm.invoke(messages)
    return response.content.strip().lower()


def casual_agent(current_query: str, conversation_history: str) -> str:
    """Handle casual conversations with personality"""
    messages = [
        SystemMessage(content=(
            "You are a friendly, knowledgeable interior design assistant with a warm personality. "
            "Respond conversationally to casual messages while maintaining professionalism. "
            "Keep responses concise (1-2 sentences), empathetic, and design-focused when relevant."
        )),
        HumanMessage(content=(
            f"Conversation History:\n{conversation_history}\n\n"
            f"User's Current Message: {current_query}"
        ))
    ]
    response = llm.invoke(messages)
    return response.content.strip()


def planner_agent(question: str, context: str = "") -> str:
    """Break down complex problems with context awareness"""
    messages = [
        SystemMessage(content=(
            "You are an expert interior design problem decomposer. "
            "Create a clear, logical step-by-step plan considering all context. "
            "Include relevant details from conversation history. "
            "Format as numbered steps. DO NOT solve - only outline the plan."
        )),
        HumanMessage(content=(
            f"Context from Conversation:\n{context}\n\n"
            f"Current Question: {question}"
        ))
    ]
    response = llm.invoke(messages)
    return response.content.strip()


def reasoner_agent(plan: str, question: str, context: str = "", feedback: str = "") -> str:
    """Execute plan with detailed reasoning and incorporate feedback"""
    content = f"Context from Conversation:\n{context}\n\n"
    content += f"Current Question: {question}\n\nPlan:\n{plan}"
    
    if feedback:
        content += f"\n\nPrevious Verification Feedback:\n{feedback}"

    messages = [
        SystemMessage(content=(
            "You are a meticulous interior design reasoning expert. "
            "Follow the EXACT plan provided. Show all work with Chain-of-Thought reasoning. "
            "Incorporate conversation context and verification feedback when provided. "
            "End with: 'Final Answer: [answer]'"
        )),
        HumanMessage(content=content)
    ]
    response = llm.invoke(messages)
    return response.content.strip()


def verifier_agent(reasoning: str, question: str, context: str = "") -> Tuple[bool, str]:
    """Verify reasoning with context awareness and return (is_valid, feedback_or_answer)"""
    messages = [
        SystemMessage(content=(
            "You are a critical interior design verification expert. "
            "Review the reasoning for: logical errors, calculation mistakes, missing context, design principle violations. "
            "If completely correct, respond EXACTLY: 'VERIFIED: [final answer]' "
            "If flawed, provide specific correction instructions and missing considerations."
        )),
        HumanMessage(content=(
            f"Context from Conversation:\n{context}\n\n"
            f"Original Question: {question}\n\n"
            f"Reasoning to Verify:\n{reasoning}"
        ))
    ]
    response = llm.invoke(messages)
    result = response.content.strip()
    
    if result.startswith("VERIFIED:"):
        return True, result.split("VERIFIED:", 1)[-1].strip()
    return False, result#.replace("VERIFIED", "")


def extract_final_answer(reasoning: str) -> str:
    """Safely extract final answer from reasoning trace (used only for logging/fallback prep)"""
    for line in reversed(reasoning.split('\n')):
        if "Final Answer:" in line:
            return line.split("Final Answer:", 1)[-1].strip()
    return ""


def fallback_direct_answer(question: str, context: str = "") -> str:
    """Use LLM directly as last-resort fallback when verification fails"""
    messages = [
        SystemMessage(content=(
            "You are an expert interior design assistant. "
            "Provide a concise, reasonable, and helpful answer to the user's question based on your knowledge. "
            "Do not mention uncertainty—just give the best possible answer."
        )),
        HumanMessage(content=(
            f"Context (if any):\n{context}\n\n"
            f"Question:\n{question}"
        ))
    ]
    response = llm.invoke(messages)
    return response.content.strip()


def reasoning_agent(
    question: str, 
    context: str = "",
    max_iterations: int = 3
) -> str:
    """Execute multi-agent reasoning with verification loops and LLM fallback"""
    feedback = ""
    
    for iteration in range(max_iterations):
        plan = planner_agent(question, context)
        reasoning = reasoner_agent(
            plan=plan,
            question=question,
            context=context,
            feedback=feedback
        )
        
        is_valid, verification_result = verifier_agent(reasoning, question, context)
        
        if is_valid:
            return verification_result  # Verified and clean
        
        # Use feedback in next iteration
        feedback = verification_result
    
    # ❗ All iterations failed → Use LLM directly as intelligent fallback
    return fallback_direct_answer(question, context)


def process_query(current_query: str, conversation: List[Dict[str, str]]) -> str:
    """End-to-end query processing with adaptive routing"""
    conversation_history = format_conversation_history(conversation)
    route = router_agent(current_query, conversation_history)
    
    if route == "casual":
        return casual_agent(current_query, conversation_history)
    
    return reasoning_agent(
        question=current_query,
        context=conversation_history,
        max_iterations=3
    )




@app.post("/run")
def run_agent(req: QueryRequest) -> Dict[str, str]:
    """FastAPI endpoint with conversation awareness"""
    try:
        y_0 = await client.call_tool("retrieve_related_text", {"query_text": req.query, "index_name": "llama-text-embed-v2-index", "folder_path": "./uploads/", "extensions": ['.txt', '.doc', '.docx'], "namespace": "example-namespace"})
        results = y_0.content[0].text
        input_user = f"Related texts:\n{str(results)}\n\nThe following below is a message from the User:\n\n"+req.query
        

        response = process_query(input_user, req.conversation)
        if "</think>" in response:#
            idx_start = response.find("</think>")
            response = response[idx_start+len("</think>"):]
        else:
            pass
        return {"result": response}
    except Exception as e:
        error_msg = f"System error: {str(e)}. Please try rephrasing your request."
        return {"result": error_msg}

