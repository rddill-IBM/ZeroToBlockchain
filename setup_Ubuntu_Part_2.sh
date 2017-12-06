#!/bin/bash

 
 YELLOW='\033[1;33m'
 RED='\033[1;31m'
 GREEN='\033[1;32m'
 RESET='\033[0m'

# exit on error

# Array of supported versions
declare -a versions=('trusty' 'xenial' 'yakkety');

# check the version and extract codename of ubuntu if release codename not provided by user
    lsb_release -a || (echo "Error: Release information not found, run script passing Ubuntu version codename as a parameter"; exit 1)
    CODENAME=$(lsb_release -a | grep 'Codename:' | awk '{print $2}')

# check version is supported
if echo ${versions[@]} | grep -q -w ${CODENAME}; then
    echo "Installing Hyperledger Composer prereqs for Ubuntu ${CODENAME}"
else
    echo "Error: Ubuntu ${CODENAME} is not supported"
    exit 1
fi


# indent text on echo
function indent() {
  c='s/^/       /'
  case $(uname) in
    Darwin) sed -l "$c";;
    *)      sed -u "$c";;
  esac
}

# displays where we are, uses the indent function (above) to indent each line
function showStep ()
    {
        echo -e "${YELLOW}=====================================================" | indent
        echo -e "${RESET}-----> $*" | indent
        echo -e "${YELLOW}=====================================================${RESET}" | indent
    }

# Grab the current directory
function getCurrent() 
    {
        showStep "getting current directory"
        DIR="$( pwd )"
        THIS_SCRIPT=`basename "$0"`
        showStep "Running '${THIS_SCRIPT}'"
        UBUNTU_ARCH=`uname -m`
        UBUNTU_VERSION=`lsb_release -c | grep "Codename:"  | awk '{print $2}'`
        showStep "found Ubuntu ${UBUNTU_VERSION} as an ${UBUNTU_ARCH} system"
        if [[ $UBUNTU_ARCH != "x86_64" ]]; then
            showStep "Install Failed, need a 64 bit system. This is ${UBUNTU_ARCH}"
            exit 1
        fi
        if [[ ${UBUNTU_VERSION} != "xenial" ]]; then
            showStep "Install Failed, need a Ubuntu 16 LTS. This is ${UBUNTU_VERSIO}"
            exit 1
        fi
    }

# create a folder for the hyperledger fabric images and get them from the server
function install_hlf ()
    {
        if [[ $HLF_INSTALL == "true" ]]; then
            if [ ! -d "$HLF_INSTALL_PATH" ]; then
                showStep "creating hlf tools folder $HLF_INSTALL_PATH "
                mkdir -p "$HLF_INSTALL_PATH"
            fi
            cd "$HLF_INSTALL_PATH"
            pwd
            showStep "retrieving image scripts from git"
            curl -O https://raw.githubusercontent.com/hyperledger/composer-tools/master/packages/fabric-dev-servers/fabric-dev-servers.zip
            showStep "unzipping images"
            unzip -o fabric-dev-servers.zip
            showStep "making scripts executable"
            dos2unix `ls *.sh`
            cd fabric-scripts/hlfv1
            dos2unix `ls *.sh`
            showStep "getting docker images for HyperLedger Fabric V1"
            export FABRIC_VERSION=hlfv1
            # the following line is here to ensure that the subsequent echos start on a new line. 
            echo ' ' >> ~/.bashrc
            echo 'FABRIC_VERSION="hlfv1"' >> ~/.bashrc
            cd $HLF_INSTALL_PATH
            ./downloadFabric.sh
            showStep "installing platform specific binaries for Ubuntu"
            curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/release/scripts/bootstrap-1.0.1.sh | bash
            export PATH=$HLF_INSTALL_PATH/bin:$PATH
            export HLF_INSTALL_PATH=$HLF_INSTALL_PATH
            echo 'PATH="'"${HLF_INSTALL_PATH}/bin:$PATH"'"' >>~/.profile
            echo 'HLF_INSTALL_PATH="'"${HLF_INSTALL_PATH}"'"'  >>~/.bashrc
            echo 'export HLF_INSTALL_PATH'  >>~/.bashrc
            echo 'export FABRIC_VERSION'  >>~/.bashrc
            if [ -d "~/.composer" ]; then
                sudo chmod +rw ~/.composer
            else
                cd $HLF_INSTALL_PATH
                ./createPeerAdminCard.sh
                sudo chmod +rw ~/.composer
            fi
        else   
            showStep "${RED}skipping HyperLedger Fabric install"
        fi
    }
function printHelp ()
{
    printHeader
    echo ""
    echo -e "${RESET} options for this exec are: "
    echo -e "${GREEN}-h ${RESET}Print this help information" | indent
    echo -e "${GREEN}-f ${RESET}defaults to ${GREEN}true${RESET}. use ${YELLOW}-d false ${RESET}if you do not want to have hypleledger fabric images verified" | indent
    echo -e "${GREEN}-p ${RESET}defaults to ${GREEN}${HOME}/fabric-tools${RESET}. use ${YELLOW}-p ${HOME}/your/preferred/path/fabric-tools/your/path/here ${RESET}if you want to install hyperledger fabric tools elsewhere." | indent
    echo -e "\t\tonly valid with -f true, ignored otherwise" | indent
    echo ""
    echo ""
}

# print the header information for execution
function printHeader ()
{
    echo ""
    echo -e "${YELLOW}installation script for the Zero To Blockchain Series" | indent
    echo -e "${RED}This is for Linux ONLY. It has been tested on Ubuntu 16.04 LTS" | indent
    echo -e "${YELLOW}Other versions of Linux are not supported via this script. " | indent
    echo -e "${YELLOW}The following will be downloaded by this script" | indent
     echo -e "${YELLOW}The script will finish by downloading the docker images for hyperledger${RESET}" | indent
    echo ""
}
# get the command line options

HLF_INSTALL="true"
HLF_INSTALL_PATH="${HOME}/fabric-tools"

 while getopts "h:p:f:" opt; 
do
    case "$opt" in
        h|\?)
        printHelp
        exit 0
        ;;
        f)  showStep "option passed for hyperledger fabric install is: '$OPTARG'" 
            if [[ $OPTARG != "" ]]; then 
                HLF_INSTALL=$OPTARG 
            fi
        ;;
        p)  showStep "option passed for fabric tools path is: '$OPTARG'" 
            if [[ $OPTARG != "" ]]; then 
                HLF_INSTALL_PATH=$OPTARG 
            fi
        ;;
    esac
 done

    printHeader
    echo  "Parameters:"
    echo -e "Install HyperLedger Fabric? ${GREEN} $HLF_INSTALL ${RESET}" | indent
    echo -e "Hyperledger fabric tools install path? ${GREEN} $HLF_INSTALL_PATH ${RESET}" | indent


    getCurrent
    showStep "installing hyperledger docker images"
    install_hlf
    showStep "Copying PeerAdmin Credentials"
    if [ -d "~/.hfc-key-store" ]; then
        cp -Rv $HLF_INSTALL_PATH/fabric-scripts/hlfv1/composer/creds/* ~/.hfc-key-store
    else
        mkdir ~/.hfc-key-store
        cp -Rv $HLF_INSTALL_PATH/fabric-scripts/hlfv1/composer/creds/* ~/.hfc-key-store
    fi
    showStep "installation complete"
