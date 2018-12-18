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
        # check for 64 bit Ubuntu
        if [[ $UBUNTU_ARCH != "x86_64" ]]; then
            showStep "Install Failed, need a 64 bit system. This is ${UBUNTU_ARCH}"
            exit 1
        fi
        # check version is supported
        if echo ${versions[@]} | grep -q -w ${CODENAME}; then
            echo "Installing Hyperledger Composer prereqs for Ubuntu ${CODENAME}"
        else
            echo "Error: Ubuntu ${CODENAME} is not supported"
            exit 1
        fi

    }

# update and upgrade apt-get
function checkaptget ()
    {
        showStep "updating apt-get to latest repositories"
        sudo apt-get update
        showStep "upgrading your installed packages"
        yes | sudo apt-get upgrade			
	    showStep "installing dos2unix exec"
        sudo apt-get install -y dos2unix
        showStep "installing base dev pre-requisites"
        sudo apt-get -y install build-essential libssl-dev
        showStep "Ensure that CA certificates are installed"
        sudo apt-get -y install apt-transport-https ca-certificates
        showStep "Add Docker repository key to APT keychain"
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
        showStep "Update where APT will search for Docker Packages"
        echo "deb [arch=amd64] https://download.docker.com/linux/ubuntu ${UBUNTU_VERSION} stable" | \
            sudo tee /etc/apt/sources.list.d/docker.list

        showStep "Update package lists"
        sudo apt-get update

        showStep "Verifies APT is pulling from the correct Repository"
        sudo apt-cache policy docker-ce

    }

# check to see if Python V2.7 is installed. Install it if it's not already there. 
function checkPython2 ()
{
    which python
    if [ "$?" -ne 0 ]; then
        showStep "No versions of Python installed. Installing Python 2.7"
        sudo apt-get -y install python2.7 python-pip
        RC=$?
        if [[ $RC != 0 ]]; then
            showStep "python 2.7 install exited with $RC"
            exit $RC
        fi

    else
        PYTHON_VERSION=`python -c 'import sys; version=sys.version_info[:3]; print("{0}.{1}.{2}".format(*version))'`
        PYTHON_CHECK=`python -c 'import sys; version=sys.version_info[:3]; print("{0}.{1}.{2}".format(*version))' | grep "2.7"`
        showStep "python version is: ${PYTHON_VERSION}"
        showStep "python check is: ${PYTHON_CHECK}"
        if [[ ${PYTHON_CHECK} == "" ]]; then
            showStep "python V2.7 not installed, installing it now."
            sudo apt-get -y install python2.7 python-pip
            RC=$?
            if [[ $RC != 0 ]]; then
                showStep "python 2.7 install exited with $RC"
                exit $RC
            fi
        else
            showStep "${GREEN}python V2.7 already installed, skipping install step."
        fi
    fi
}
# check to see if nodeV8 is installed. install it if it's not already there. 
function check4node ()
    {
        if [[ $NODE_INSTALL == "true" ]]; then 
            which node
            if [ "$?" -ne 0 ]; then
		        nodeV8Install
            else            
                NODE_VERSION=`node --version | grep "v8"`  
                showStep "Node Version is  ${NODE_VERSION}"       
                if [[ ${NODE_VERSION} == "" ]]; then
                    showStep "${RED}found node $? installed, but not V8. installing Node V8"
                    nodeV8Install
                else
                    showStep "${GREEN}Node V8 already installed"
                fi
            fi
        else   
            showStep "${RED}skipping NODE install"
        fi
        showStep "installing jsdoc globally"
        npm install -g jsdoc
    }

# install Node V8
function nodeV8Install()
{
        showStep "${RED}node not installed. installing Node V8"
	# Install nvm dependencies
	showStep "Installing nvm dependencies"
	sudo apt-get -y install build-essential libssl-dev

	# Execute nvm installation script
	showStep "Executing nvm installation script"
	curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash
    RC=$?
    if [[ $RC != 0 ]]; then
        showStep "nvm install exited with $RC"
        exit $RC
    fi

	showStep "Set up nvm environment without restarting the shell"
	export NVM_DIR="${HOME}/.nvm"
	[ -s "${NVM_DIR}/nvm.sh" ] && . "${NVM_DIR}/nvm.sh"
	[ -s "${NVM_DIR}/bash_completion" ] && . "${NVM_DIR}/bash_completion"

	showStep "Installing nodeJS"
	nvm install 8.12.0
    RC=$?
    if [[ $RC != 0 ]]; then
        showStep "nvm lts install exited with $RC"
        exit $RC
    fi

	showStep "Configure nvm to use version 8"
    nvm alias default 8.12.0

	nvm use v8.12.0

	# Install the latest version of npm
	showStep "Installing npm"
	npm install npm@latest -g
    RC=$?
    if [[ $RC != 0 ]]; then
        showStep "npm install exited with $RC"
        exit $RC
    fi

}
# check to see if git is installed. install it if it's not already there. 
function check4git ()
    {
        if [[ $GITHUB_INSTALL == "true" ]]; then
            which git
            if [ "$?" -ne 0 ]; then
                showStep "${RED}git not installed. installing git"
		sudo apt-add-repository -y ppa:git-core/ppa
		sudo apt-get update
                sudo apt-get install -y git
                RC=$?
                if [[ $RC != 0 ]]; then
                    showStep "git install exited with $RC"
                    exit $RC
                fi
            else
                showStep "${GREEN}git already installed"
            fi
        else   
            showStep "${RED}skipping git install"
        fi
    }

# Install the node modules required to work with hyperledger composer
function installNodeDev ()
    {
        if [[ $SDK_INSTALL == "true" ]]; then
            showStep "The composer-cli contains all the command line operations for developing business networks."
            npm uninstall -g composer-cli
            npm install -g --python=python2.7 composer-cli@0.16.2
            showStep "The generator-hyperledger-composer is a Yeoman plugin that creates bespoke applications for your business network."
            npm uninstall -g generator-hyperledger-composer
            npm install -g --python=python2.7 generator-hyperledger-composer@0.16.2
            showStep "The composer-rest-server uses the Hyperledger Composer LoopBack Connector to connect to a business network, extract the models and then present a page containing the REST APIs that have been generated for the model."
            npm uninstall -g composer-rest-server
            npm install -g --python=python2.7 composer-rest-server@0.16.2
            showStep "Yeoman is a tool for generating applications. When combined with the generator-hyperledger-composer component, it can interpret business networks and generate applications based on them."
            npm install -g --python=python2.7 yo
        else   
            showStep "${RED}skipping NODE SDK for HyperLedger install"
        fi
    }

# install python

# Install docker
function install_docker ()
{
       if [[ $DOCKER_INSTALL == "true" ]]; then
	 	showStep "Ensure that CA certificates are installed"
		sudo apt-get -y install apt-transport-https ca-certificates

		showStep "Add Docker repository key to APT keychain"
		curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

		showStep "Update where APT will search for Docker Packages"
		echo "deb [arch=amd64] https://download.docker.com/linux/ubuntu ${CODENAME} stable" | \
		    sudo tee /etc/apt/sources.list.d/docker.list

		showStep "Update package lists"
		sudo apt-get update

		showStep "Verifies APT is pulling from the correct Repository"
		sudo apt-cache policy docker-ce

		showStep "Install kernel packages which allows us to use aufs storage driver if V14 (trusty/utopic)"
		if [ "${CODENAME}" == "trusty" ]; then
		    showStep "Installing required kernel packages"
		    sudo apt-get -y install linux-image-extra-$(uname -r) linux-image-extra-virtual
		fi

		showStep "Install Docker"
		sudo apt-get -y install docker-ce

		showStep "Add user account to the docker group"
		sudo usermod -aG docker $(whoami)

        showStep "Installing docker-composer"
        sudo curl -L https://github.com/docker/compose/releases/download/1.16.0-rc1/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose

	else
		showStep "${RED} docker installation skipped"
	fi
}

function printHelp ()
{
    printHeader
    echo ""
    echo -e "${RESET} options for this exec are: "
    echo -e "${GREEN}-h ${RESET}Print this help information" | indent
    echo -e "${GREEN}-g ${RESET}defaults to ${GREEN}true${RESET}. use ${YELLOW}-g false ${RESET}if you do not want to have git installation checked"  | indent
    echo -e "${GREEN}-n ${RESET}defaults to ${GREEN}true${RESET}. use ${YELLOW}-n false ${RESET}if you do not want to have node installation checked" | indent
    echo -e "${GREEN}-s ${RESET}defaults to ${GREEN}true${RESET}. use ${YELLOW}-s false ${RESET}if you do not want to have node SDK installation checked" | indent
    echo -e "${GREEN}-d ${RESET}defaults to ${GREEN}true${RESET}. use ${YELLOW}-d false ${RESET}if you do not want to have docker installed" | indent
    echo ""
    echo ""
}

# print the header information for execution
function printHeader ()
{
    echo ""
    echo -e "${YELLOW}installation script for the Zero To Blockchain Series" | indent
    echo -e "${GREEN}This is for Linux ONLY. It has been tested on Ubuntu 16 LTS and on Ubuntu 18 LTS" | indent
    echo -e "${YELLOW}Other versions of Linux are not supported via this script. " | indent
    echo -e "${YELLOW}The following will be downloaded by this script" | indent
    echo -e "${YELLOW}dos2unix, to correct scripts from hyperledger and composer" | indent
    echo -e "${YELLOW}docker for Ubuntu" | indent
    echo -e "${YELLOW}The exec will proceed with checking to ensure you are at Node V8" | indent
    echo -e "${YELLOW}which is required for working with HyperLedger Composer" | indent
    echo -e "${YELLOW}The script will then install the nodejs SDK for hyperledger and composer" | indent
    echo -e "${YELLOW}The script will finish by requesting that you reboot your system${RESET}" | indent
    echo ""
}
# get the command line options

GITHUB_INSTALL="true"
NODE_INSTALL="true"
SDK_INSTALL="true"
DOCKER_INSTALL="true"

 while getopts "h:g:n:d:s:" opt; 
do
    case "$opt" in
        h|\?)
        printHelp
        exit 0
        ;;
        g)  showStep "option passed for github is: '$OPTARG'" 
            if [[ $OPTARG != "" ]]; then 
                GITHUB_INSTALL=$OPTARG 
            fi
        ;;
        n)  showStep "option passed for node is: '$OPTARG'" 
            if [[ $OPTARG != "" ]]; then 
                NODE_INSTALL=$OPTARG 
            fi
        ;;
        s)  showStep "option passed for node SDK is: '$OPTARG'" 
            if [[ $OPTARG != "" ]]; then 
                SDK_INSTALL=$OPTARG 
            fi
        ;;
        d)  showStep "option passed for docker install is: '$OPTARG'" 
            if [[ $OPTARG != "" ]]; then 
                DOCKER_INSTALL=$OPTARG 
            fi
        ;;
    esac
 done

    printHeader
    echo  "Parameters:"
    echo -e "Install github? ${GREEN}$GITHUB_INSTALL${RESET}" | indent
    echo -e "Install nodejs? ${GREEN} $NODE_INSTALL ${RESET}" | indent
    echo -e "Install nodejs SDK? ${GREEN} $SDK_INSTALL ${RESET}" | indent
    echo -e "Install Docker? ${GREEN} $DOCKER_INSTALL ${RESET}" | indent

    getCurrent
    showStep "checking apt-get status"
    checkaptget
    showStep "checking python V2.7"
    checkPython2
    showStep "checking git"
    check4git
    showStep "checking nodejs"
    check4node
    showStep "installing nodejs SDK for hyperledger composer"
    installNodeDev
    showStep "Installing docker for Ubuntu"
    install_docker
    showStep "installing ubuntu extras to get necessary fonts. Please accept the license agreements when prompted."
    sudo apt-get -y install ubuntu-restricted-extras
    showStep "installation Part 1 complete"
    showStep "${RED} Reboot is required prior to executing step 2"
