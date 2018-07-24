#!/bin/bash
 
. ../common_OSX.sh

function install_CLI ()
{
    showStep "installing Ubuntu or OSX cloud Foundry CLI"
    curl -sL http://ibm.biz/idt-installer | bash

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
    showStep "Retrieving Ubuntu or OSX kubectl"
    if [[ $OS == "Darwin" ]] || [[ $OS == "darwin" ]]; then
        echo "updating kubectl for OSX"
        curl -LO https://storage.googleapis.com/kubernetes-release/release/`curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt`/bin/darwin/amd64/kubectl
    else
        echo "updating kubectl for Linux"
        curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl
    fi


    showStep "making kubectl executable"
    sudo chmod +x kubectl

    showStep "moving kubectl to correct location"
    sudo mv ./kubectl /usr/local/bin/kubectl
}

install_kubectl
install_CLI

