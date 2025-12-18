"""
Natural Language Test Automation Agent
A Streamlit-based web application that uses AI to execute browser tests from natural language instructions.
"""

import streamlit as st
import asyncio
import os
from datetime import datetime

# Page configuration
st.set_page_config(
    page_title="AI Test Automation Agent",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for enhanced UI
st.markdown("""
<style>
    .main-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
    }
    .status-success {
        background-color: #d4edda;
        border: 1px solid #c3e6cb;
        border-radius: 8px;
        padding: 1rem;
        color: #155724;
    }
    .status-error {
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 8px;
        padding: 1rem;
        color: #721c24;
    }
    .status-running {
        background-color: #cce5ff;
        border: 1px solid #b8daff;
        border-radius: 8px;
        padding: 1rem;
        color: #004085;
    }
    .log-container {
        background-color: #1e1e1e;
        border-radius: 8px;
        padding: 1rem;
        font-family: 'Courier New', monospace;
        font-size: 0.85rem;
        color: #d4d4d4;
        max-height: 400px;
        overflow-y: auto;
    }
    .stTextArea textarea {
        font-size: 1rem;
    }
</style>
""", unsafe_allow_html=True)


def initialize_session_state():
    """Initialize session state variables."""
    if 'agent_logs' not in st.session_state:
        st.session_state.agent_logs = []
    if 'execution_result' not in st.session_state:
        st.session_state.execution_result = None
    if 'is_running' not in st.session_state:
        st.session_state.is_running = False
    if 'screenshots' not in st.session_state:
        st.session_state.screenshots = []


def add_log(message: str, level: str = "INFO"):
    """Add a log message to the session state."""
    timestamp = datetime.now().strftime("%H:%M:%S")
    log_entry = f"[{timestamp}] [{level}] {message}"
    st.session_state.agent_logs.append(log_entry)


async def run_agent(task: str, api_key: str, headless: bool = True, provider: str = "google", model: str = None):
    """
    Run the browser-use agent with the given task.
    
    Args:
        task: Natural language test instructions
        api_key: API key for the selected provider
        headless: Whether to run browser in headless mode
        provider: LLM provider ("google" or "openai")
        model: Model name to use (optional, uses default if not specified)
    
    Returns:
        Agent execution result
    """
    try:
        # Import browser-use components
        from browser_use import Agent, Browser
        
        if provider == "openai":
            from browser_use import ChatOpenAI
            
            add_log("Initializing LLM with OpenAI...", "INFO")
            
            # Set the API key in environment
            os.environ['OPENAI_API_KEY'] = api_key
            
            # Initialize the LLM
            selected_model = model or "gpt-4o"
            llm = ChatOpenAI(model=selected_model)
        else:
            from browser_use import ChatGoogle
            
            add_log("Initializing LLM with Google Gemini...", "INFO")
            
            # Set the API key in environment
            os.environ['GOOGLE_API_KEY'] = api_key
            
            # Initialize the LLM
            selected_model = model or "gemini-2.5-flash"
            llm = ChatGoogle(model=selected_model)
        
        add_log("Configuring browser settings...", "INFO")
        
        # Configure browser
        browser = Browser(headless=headless)
        
        add_log(f"Creating agent with task: {task[:100]}...", "INFO")
        
        # Create the agent
        agent = Agent(
            task=task,
            llm=llm,
            browser=browser
        )
        
        add_log("Starting agent execution...", "INFO")
        
        # Run the agent
        result = await agent.run()
        
        add_log("Agent execution completed successfully!", "SUCCESS")
        
        return {
            "success": True,
            "result": result,
            "error": None
        }
        
    except ImportError as e:
        error_msg = f"Import error: {str(e)}. Please ensure all dependencies are installed."
        add_log(error_msg, "ERROR")
        return {
            "success": False,
            "result": None,
            "error": error_msg
        }
    except Exception as e:
        error_msg = f"Agent execution failed: {str(e)}"
        add_log(error_msg, "ERROR")
        return {
            "success": False,
            "result": None,
            "error": error_msg
        }


def render_sidebar():
    """Render the sidebar with configuration options."""
    with st.sidebar:
        st.header("⚙️ Configuration")
        
        st.subheader("🤖 LLM Provider")
        provider = st.selectbox(
            "Select Provider",
            options=["Google Gemini", "OpenAI"],
            index=0,
            help="Choose your preferred LLM provider"
        )
        
        # Model selection based on provider
        if provider == "Google Gemini":
            model_options = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"]
            default_model = "gemini-2.5-flash"
        else:
            model_options = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"]
            default_model = "gpt-4o"
        
        model = st.selectbox(
            "Model",
            options=model_options,
            index=0,
            help="Select the model to use"
        )
        
        st.divider()
        
        st.subheader("🔑 API Settings")
        
        if provider == "Google Gemini":
            api_key = st.text_input(
                "Google API Key",
                type="password",
                help="Enter your Google Gemini API key",
                placeholder="AIza..."
            )
        else:
            api_key = st.text_input(
                "OpenAI API Key",
                type="password",
                help="Enter your OpenAI API key",
                placeholder="sk-..."
            )
        
        st.divider()
        
        st.subheader("🌐 Browser Settings")
        headless = st.checkbox(
            "Headless Mode",
            value=False,
            help="Run browser without visible window (faster but no visual feedback)"
        )
        
        st.divider()
        
        st.subheader("📖 Instructions")
        st.markdown(f"""
        1. Select your LLM provider ({provider})
        2. Enter your API key
        3. Write test steps in natural language
        4. Click **Run Test** to execute
        5. View results and screenshots below
        """)
        
        st.divider()
        
        provider_name = "Google Gemini" if provider == "Google Gemini" else "OpenAI"
        st.caption(f"Powered by browser-use & {provider_name}")
        
        # Convert provider to internal format
        provider_key = "google" if provider == "Google Gemini" else "openai"
        
        return api_key, headless, provider_key, model


def render_main_content(api_key: str, headless: bool, provider: str, model: str):
    """Render the main content area."""
    
    # Header
    st.markdown('<h1 class="main-header">🤖 AI Test Automation Agent</h1>', unsafe_allow_html=True)
    st.markdown("*Execute browser tests using natural language instructions*")
    
    st.divider()
    
    # Test input area
    col1, col2 = st.columns([3, 1])
    
    with col1:
        test_instructions = st.text_area(
            "📝 Test Instructions",
            height=200,
            placeholder="""Enter your test steps in natural language, for example:

1. Go to google.com
2. Search for 'Streamlit Python'
3. Click on the first search result
4. Take a screenshot of the page""",
            help="Describe what you want the agent to do in plain English"
        )
    
    with col2:
        st.markdown("### Example Tasks")
        st.markdown("""
        - Navigate to a website
        - Fill out forms
        - Click buttons/links
        - Extract text content
        - Take screenshots
        - Verify page elements
        """)
    
    # Run button
    col_btn1, col_btn2, col_btn3 = st.columns([1, 1, 2])
    
    with col_btn1:
        run_button = st.button(
            "▶️ Run Test",
            type="primary",
            use_container_width=True,
            disabled=st.session_state.is_running
        )
    
    with col_btn2:
        if st.button("🗑️ Clear Logs", use_container_width=True):
            st.session_state.agent_logs = []
            st.session_state.execution_result = None
            st.session_state.screenshots = []
            st.rerun()
    
    st.divider()
    
    # Handle run button click
    if run_button:
        if not api_key:
            provider_name = "OpenAI" if provider == "openai" else "Google"
            st.error(f"⚠️ Please enter your {provider_name} API key in the sidebar.")
        elif not test_instructions.strip():
            st.error("⚠️ Please enter test instructions.")
        else:
            st.session_state.is_running = True
            st.session_state.agent_logs = []
            st.session_state.execution_result = None
            
            # Create a placeholder for live updates
            status_placeholder = st.empty()
            
            with status_placeholder.container():
                st.markdown('<div class="status-running">🔄 Agent is executing...</div>', unsafe_allow_html=True)
            
            # Run the agent
            try:
                result = asyncio.run(run_agent(
                    task=test_instructions,
                    api_key=api_key,
                    headless=headless,
                    provider=provider,
                    model=model
                ))
                st.session_state.execution_result = result
            except Exception as e:
                st.session_state.execution_result = {
                    "success": False,
                    "result": None,
                    "error": str(e)
                }
                add_log(f"Unexpected error: {str(e)}", "ERROR")
            finally:
                st.session_state.is_running = False
                st.rerun()
    
    # Display results
    render_results()


def render_results():
    """Render the execution results and logs."""
    
    # Agent Logs
    with st.expander("📋 Agent Logs", expanded=True):
        if st.session_state.agent_logs:
            log_text = "\n".join(st.session_state.agent_logs)
            st.markdown(f'<div class="log-container"><pre>{log_text}</pre></div>', unsafe_allow_html=True)
        else:
            st.info("No logs yet. Run a test to see agent activity.")
    
    # Execution Result
    if st.session_state.execution_result:
        result = st.session_state.execution_result
        
        st.subheader("📊 Execution Result")
        
        if result["success"]:
            st.markdown('<div class="status-success">✅ <strong>Test Completed Successfully!</strong></div>', unsafe_allow_html=True)
            
            # Display result details if available
            if result["result"]:
                with st.expander("🔍 Detailed Result", expanded=False):
                    agent_result = result["result"]
                    
                    # Handle AgentHistory object
                    if hasattr(agent_result, 'final_result'):
                        st.markdown("**Final Result:**")
                        st.write(agent_result.final_result())
                    
                    if hasattr(agent_result, 'errors') and agent_result.errors():
                        st.markdown("**Errors:**")
                        for error in agent_result.errors():
                            st.error(str(error))
                    
                    if hasattr(agent_result, 'urls') and agent_result.urls():
                        st.markdown("**Visited URLs:**")
                        for url in agent_result.urls():
                            st.write(f"- {url}")
                    
                    if hasattr(agent_result, 'screenshots') and agent_result.screenshots():
                        st.markdown("**Screenshots:**")
                        for idx, screenshot in enumerate(agent_result.screenshots()):
                            try:
                                # Handle different screenshot formats
                                if isinstance(screenshot, str):
                                    # Could be a file path or base64
                                    import os
                                    import base64
                                    if os.path.exists(screenshot):
                                        st.image(screenshot, caption=f"Screenshot {idx + 1}")
                                    elif screenshot.startswith('data:image'):
                                        # Base64 data URL
                                        st.image(screenshot, caption=f"Screenshot {idx + 1}")
                                    else:
                                        # Try as base64 encoded
                                        try:
                                            img_data = base64.b64decode(screenshot)
                                            st.image(img_data, caption=f"Screenshot {idx + 1}")
                                        except:
                                            st.write(f"Screenshot {idx + 1}: {screenshot[:100]}...")
                                elif isinstance(screenshot, bytes):
                                    st.image(screenshot, caption=f"Screenshot {idx + 1}")
                                elif hasattr(screenshot, 'save'):
                                    # PIL Image - convert to bytes
                                    import io
                                    buf = io.BytesIO()
                                    screenshot.save(buf, format='PNG')
                                    st.image(buf.getvalue(), caption=f"Screenshot {idx + 1}")
                                else:
                                    st.write(f"Screenshot {idx + 1}: {type(screenshot)}")
                            except Exception as e:
                                st.warning(f"Could not display screenshot {idx + 1}: {str(e)}")
                    
                    # Fallback: show string representation
                    if not any([
                        hasattr(agent_result, 'final_result'),
                        hasattr(agent_result, 'urls'),
                        hasattr(agent_result, 'screenshots')
                    ]):
                        st.code(str(agent_result), language=None)
        else:
            st.markdown(f'<div class="status-error">❌ <strong>Test Failed</strong><br><br>{result["error"]}</div>', unsafe_allow_html=True)
        
        # Screenshots section
        if st.session_state.screenshots:
            st.subheader("📸 Screenshots")
            cols = st.columns(min(len(st.session_state.screenshots), 3))
            for idx, screenshot in enumerate(st.session_state.screenshots):
                with cols[idx % 3]:
                    st.image(screenshot, caption=f"Screenshot {idx + 1}")


def main():
    """Main application entry point."""
    initialize_session_state()
    
    # Render sidebar and get configuration
    api_key, headless, provider, model = render_sidebar()
    
    # Render main content
    render_main_content(api_key, headless, provider, model)


if __name__ == "__main__":
    main()
