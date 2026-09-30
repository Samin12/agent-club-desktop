' start-hud.vbs — launches the HUD server hidden + detached (Windows).
' Survives the terminal/Claude session that started it. Uses the production
' build when one exists (fast, stable), else falls back to dev mode.
' Want it at login? Drop a shortcut to this file into shell:startup.
' Mac/Linux: `nohup npx next start -p 3107 &` (after `npx next build`).

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)

If fso.FolderExists(dir & "\.next") Then
  cmd = "cmd /c cd /d """ & dir & """ && npx next start -p 3107"
Else
  cmd = "cmd /c cd /d """ & dir & """ && npx next dev -p 3107"
End If

WshShell.Run cmd, 0, False
Set WshShell = Nothing
