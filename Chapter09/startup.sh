#!/bin/bash
 
. ../common_OSX.sh

showStep "using execs from previous installation, stored in ${HLF_INSTALL_PATH}"
cd "${HLF_INSTALL_PATH}"
showStep "starting fabric"
./startFabric.sh
showStep "creating new composer profile (required with each restart)"
./createComposerProfile.sh
showStep "start up complete"