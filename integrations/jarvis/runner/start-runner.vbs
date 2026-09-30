' start-runner.vbs — launches the runner daemon hidden (Windows).
' Drop a shortcut into shell:startup to run it at login.
' Mac/Linux: just `node runner/runner.js &` or a launchd/systemd unit.

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)

WshShell.Run "node """ & dir & "\runner.js""", 0, False
Set WshShell = Nothing
