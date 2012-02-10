@echo off
cd /d %~dp0

rmdir /s /q ".\applications\init" 
for /r . %%g in (*empathica*.w2p) do (
    echo Installing %%~nxg...
    mkdir ".\applications\init"
    call TarTool.exe ".\\%%~nxg" ".\applications\init"
    echo Finished installing %%~nxg
)