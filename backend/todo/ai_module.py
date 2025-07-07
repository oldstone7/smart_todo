import os
import google.generativeai as genai
from dotenv import load_dotenv
import json
load_dotenv()

class SmartTodoAI:
    def __init__(self):
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        self.model = genai.GenerativeModel('gemini-2.5-flash')

    def analyze_task(self, task_title, task_desc, context_data, current_date, current_day):
        prompt = f"""
        Today is {current_day}, {current_date}.
        You are an AI assistant helping a user plan their tasks and provide helpful productivity advice.

        Task Title: {task_title}
        Task Description: {task_desc}
        Context (e.g. user notes, email mentions, WhatsApp messages): {context_data}

        Based on the task, task description and context, return a JSON with:
        - priority_score (1 to 10) → urgency and importance of this task
        - suggested_deadline (YYYY-MM-DD) → intelligently inferred from content
        - enhanced_description → clearer and more helpful version of task summary
        - suggested_category → Chose any one from the following categories: "Work", "Personal", "Entertainment", "Health", "Study", "Shopping", "Travel", "Finance" "Others".
        - tip_or_advice → short 2-3 line practical advice or motivational reminder based on task type

        Respond ONLY with valid JSON. No extra explanation or text outside the JSON.
        """

        response = self.model.generate_content(prompt)

        try:
            return response.text
        except:
            return response.candidates[0].content.parts[0].text
        

    def rescore_tasks(self, new_task, current_tasks, current_date, current_day):
        try:
            # Prepare task list with all tasks including the new one
            all_tasks = current_tasks + [new_task]
            
            task_list = "\n".join([
                f"- {task.get('title', 'Untitled')} (Deadline: {task.get('deadline', 'No deadline')}) - "
                f"Desc: {task.get('description', 'No description')}"
                for task in all_tasks
            ])

            prompt = f"""
            Today is {current_day}, {current_date}.
            A user is trying to create a new task, but they already have the following tasks:

            {task_list}

            Re-analyze and think well as to what should be most important to a person and keep 
            ranking the lesser important below it. Return a JSON list with all tasks (including the new one) with:
            - title (string): The task title
            - new_priority_score (number 1-10): Priority score where 10 is highest priority
            - recommended_category (string): Suggested category for the task

            Make sure to consider workload and distribute priority appropriately.
            Return only a valid JSON array without any markdown formatting or additional text.
            """

            # Generate response from the model
            response = self.model.generate_content(prompt)
            
            # Extract the response text
            try:
                response_text = response.text
            except AttributeError:
                response_text = response.candidates[0].content.parts[0].text
            
            # Clean the response to ensure it's valid JSON
            response_text = response_text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:]  # Remove ```json
            if response_text.endswith('```'):
                response_text = response_text[:-3]  # Remove trailing ```
            
            # Parse and validate the JSON
            try:
                parsed = json.loads(response_text)
                if not isinstance(parsed, list):
                    raise ValueError("Expected a JSON array")
                return json.dumps(parsed)
                
            except json.JSONDecodeError as e:
                error_msg = f"Failed to parse AI response as JSON: {str(e)}\nResponse: {response_text}"
                print(error_msg)  # Log the error for debugging
                raise ValueError(error_msg)
                
        except Exception as e:
            error_msg = f"Error in rescore_tasks: {str(e)}"
            print(error_msg)  # Log the error for debugging
            raise Exception(error_msg)
