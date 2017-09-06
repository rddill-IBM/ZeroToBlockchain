#!/bin/bash
 
. ../common_OSX.sh

showStep "using execs from previous installation, stored in ${HLF_INSTALL_PATH}"
cd "${HLF_INSTALL_PATH}"
showStep "stopping fabric"
./stopFabric.sh
showStep "tear down"
./teardownFabric.sh
showStep "shut down complete"