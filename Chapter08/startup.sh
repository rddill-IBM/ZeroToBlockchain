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
        echo "DIR in startup.sh is $DIR"
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
showStep "running getCurrent"
getCurrent
showStep "using execs from previous installation, stored in ${HLF_INSTALL_PATH}"
cd "${HLF_INSTALL_PATH}"
showStep "starting fabric"
./startFabric.sh
#
# no longer required with hyperledger composer V0.15
# showStep "creating new composer profile (required with each restart)"
# ~/fabric-tools/createComposerProfile.sh
#
showStep "creating new PeerAdmin card (required with each restart)"
./createPeerAdminCard.sh 
showStep "copying admin card to ~/.hfc-key-store"
CA_PEM_SOURCE="$DIR/controller/restapi/features/composer/creds"
PEER_SOURCE="$HOME/.composer/client-data/PeerAdmin@hlfv1/*"
HFC_KEY_STORE="$HOME/.hfc-key-store"
echo "CA_PEM_SOURCE is: $CA_PEM_SOURCE"
echo "PEER_SOURCE is: $PEER_SOURCE"
echo "HFC_KEY_STORE is: $HFC_KEY_STORE"
rm -R $HFC_KEY_STORE/
mkdir $HFC_KEY_STORE
cp  -Rv ${CA_PEM_SOURCE}/ca.pem ${HFC_KEY_STORE}/
cp  -Rv ${PEER_SOURCE} ${HFC_KEY_STORE}/
cp  -Rv ${PEER_SOURCE} ${CA_PEM_SOURCE}/
showStep 'Listing current cards'
composer card list --name PeerAdmin@hlfv1
showStep "start up complete"