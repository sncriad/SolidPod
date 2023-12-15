# SolidPod
SETUP Instructions
#0. Install NPM and npm-install all packages associated with this project
#1. Set up a port forward for a given selected port (this code assumes port 44444,
but any non-reserved port number should work so long as you changed it)
#2. Get your router's public IP address, and write it into the "ip" const
at the top of fileAccess.ts and main.ts. Format it as: (http://127.0.0.1:44444/)
#3. Install a CORS control extension just in case of chrome, and allow CORS
#4. If you want to launch the server in https mode, put your CA key and cert.perm file
in the root directory, and launch the express app by any https launcher.
#5. Otherwise, modify browser settings for whatever browser you are using to allow insecure content.
#6. launch the server with npm-launch.
