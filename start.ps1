Start-Process powershell -NoNewWindow -ArgumentList "-NoExit", "-Command", "cd backend; npm start"
Start-Process powershell -NoNewWindow -ArgumentList "-NoExit", "-Command", "cd frontend; npm start"