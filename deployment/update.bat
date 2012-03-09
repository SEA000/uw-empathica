@echo off
cd /d %~dp0

for /r . %%g in (*empathica*.w2p) do (
    echo Installing %%~nxg...
    rmdir /s /q ".\applications\init" 
    mkdir ".\applications\init"
    call TarTool.exe ".\\%%~nxg" ".\applications\init"
    del %%g
    echo Finished installing %%~nxg
)