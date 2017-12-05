#!/bin/bash
 
 YELLOW='\033[1;33m'
 RED='\033[1;31m'
 GREEN='\033[1;32m'
 RESET='\033[0m'

# indent text on echo
function indent() {
  c='s/^/       /'
  case $(uname) in
    Darwin) sed -l "$c";;
    *)      sed -u "$c";;
  esac
}

# Grab the current directory
function getCurrent() 
    {
        showStep "getting current directory"
        DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
        THIS_SCRIPT=`basename "$0"`
        showStep "Running '${THIS_SCRIPT}'"
    }

# displays where we are, uses the indent function (above) to indent each line
function showStep ()
    {
        echo -e "${YELLOW}=====================================================" | indent
        echo -e "${RESET}-----> $*" | indent
        echo -e "${YELLOW}=====================================================${RESET}" | indent
    }

showStep "using execs from previous installation, stored in ${HLF_INSTALL_PATH}"
cd "${HLF_INSTALL_PATH}"
showStep "starting fabric"
~/fabric-tools/startFabric.sh
#
# no longer required with hyperledger composer V0.15
# showStep "creating new composer profile (required with each restart)"
# ~/fabric-tools/createComposerProfile.sh
#
showStep "creating new PeerAdmin card (required with each restart)"
~/fabric-tools/createPeerAdminCard.sh 
composer card list --name PeerAdmin@hlfv1
showStep "start up complete"