@echo off
cls
echo ========================================================
echo   Automatyczny Kompilator Agenta
echo ========================================================
echo.

if not exist BuildOutput (
    mkdir BuildOutput
)

echo [1] Kompilacja screen.dll (C++)...
g++ -shared -o BuildOutput\screen.dll dane\ScreenDLL\screen.cpp ^
    -DSCREEN_DLL_EXPORTS ^
    -lgdi32 -lgdiplus -lwininet -lws2_32 -lole32 ^
    -std=c++17 -O2
IF %ERRORLEVEL% NEQ 0 (
    echo [BLAD] Nie udalo sie skompilowac screen.dll!
    pause
    exit /b %errorlevel%
)
echo [SUKCES] screen.dll utworzony pomyslnie.
echo.

echo [2] Kompilacja glownego menedzera C++...
g++ dane\main.cpp -o BuildOutput\a.exe -std=c++17 -lwininet -lws2_32 -luser32 -lshell32
IF %ERRORLEVEL% NEQ 0 (
    echo [BLAD] Nie udalo sie skompilowac main.cpp!
    pause
    exit /b %errorlevel%
)
echo [SUKCES] a.exe utworzony pomyslnie.
echo.

echo [3] Kompilacja CameraAgent (C#)...
dotnet publish dane\CameraAgent\CameraAgent.csproj -c Release -p:PublishSingleFile=true --self-contained false -o BuildOutput
IF %ERRORLEVEL% NEQ 0 (
    echo [BLAD] Nie udalo sie skompilowac modulu kamery!
    pause
    exit /b %errorlevel%
)
echo [SUKCES] CameraAgent.exe utworzony pomyslnie!
echo.

echo ========================================================
echo Wszystkie pliki gotowe w BuildOutput:
echo   - a.exe          (glowny agent, musi byc obok screen.dll)
echo   - screen.dll     (modul ekranu C++)
echo   - CameraAgent.exe (modul kamery C#)
echo Odpal a.exe aby uruchomic wszystko.
echo ========================================================
pause
