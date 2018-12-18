#!/bin/bash
 
 YELLOW='\033[1;33m'
 RED='\033[1;31m'
 GREEN='\033[1;32m'
 RESET='\033[0m'
 GREY='\033[2m'

# exit on error

# Array of supported versions
declare -a versions=('trusty' 'xenial' 'yakkety' 'bionic');

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
        echo -e "${GREY}=====================================================" | indent
        echo -e "${RESET}-----> $*" | indent
        echo -e "${GREY}=====================================================${RESET}" | indent
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
            showStep "Install Failed, need an Ubuntu 16 LTS or Ubuntu 18 LTS. This is ${UBUNTU_VERSION}"
            exit 1
        fi
    }
