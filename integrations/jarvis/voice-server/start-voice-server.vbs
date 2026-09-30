' start-voice-server.vbs — launches the local Kokoro TTS server hidden.
' Drop a shortcut into shell:startup to run it at login (same pattern as
' the agentic-os runner).

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)

' Wake word off by default — speaker bleed into the mic makes hands-free
' overlap with Jarvis's own replies unless you wear headphones.
' Delete this line (or set "on") to arm hands-free.
WshShell.Environment("PROCESS")("WAKE_WORD") = "off"

WshShell.Run """" & dir & "\.venv\Scripts\python.exe"" """ & dir & "\server.py""", 0, False
Set WshShell = Nothing
