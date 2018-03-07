#!/bin/bash
 
. ../common_OSX.sh

function install_CLI ()
{
    showStep "installing cloud Foundry CLI"
    wget -q -O - https://packages.cloudfoundry.org/debian/cli.cloudfoundry.org.key | sudo apt-key add -
    echo "deb https://packages.cloudfoundry.org/debian stable main" | sudo tee /etc/apt/sources.list.d/cloudfoundry-cli.list
    sudo apt-get update
    sudo apt-get install cf-cli

    showStep "Installing BM Cloud (Bluemix) CLI"
    curl -fsSL https://clis.ng.bluemix.net/install/linux | sh

    showStep "Getting list of uninstalled IBM Cloud CLI Packages"
    PACKAGE_LIST=($(bluemix plugin repo-plugins -r Bluemix | grep "Not Installed" | awk '{print $3}'))
    
    showStep "Installing packages"
    for ((i=${#PACKAGE_LIST[@]}; i > 0; i--)); 
    do 
        echo "Installing ${PACKAGE_LIST[$i]}"; 
        bx plugin install ${PACKAGE_LIST[$i]} -r Bluemix;
    done
}

function install_kubectl
{
    showstep "Retrieving Ubuntu or OSX kubectl"
        if [[ $OS == "Darwin" ]]; then
        echo "updating for OSX"
        curl -LO https://storage.googleapis.com/kubernetes-release/release/`curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt`/bin/darwin/amd64/kubectl
    else
        echo "updating for Linux"
        curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl
    fi


    showStep "making kubectl executable"
    sudo chmod +x kubectl

    showStep "moving kubectl to correct location"
    sudo mv ./kubectl /usr/local/bin/kubectl
}

install_kubectl
install_CLI

