
@echo

set VENV_ACTIVATE= C:\Users\Dell\anaconda3\envs\maskMain\Scripts\activate
 
rem Activate the virtual environment
call %VENV_ACTIVATE%
 
rem Run Python script
echo Running script
python "D:\\Youtube_MaskRCNN\\newapp.py"
 
rem Deactivate the virtual environment
