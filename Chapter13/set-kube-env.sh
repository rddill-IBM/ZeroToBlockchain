#!/bin/bash
 
. ../common_OSX.sh

function printHelp ()
{
    printHeader
    echo ""
    echo -e "${RESET} options for this exec are: "
    echo -e "${GREEN}-h ${RESET}Print this help information" | indent
    echo -e "${GREEN}-k ${RESET}defaults to ${GREEN}Z2B${RESET}. use ${YELLOW}-k your-IBM Cloud Cluster Name ${RESET}if you are using a different Cluster name"  | indent
    echo ""
    echo ""
}

# print the header information for execution
function printHeader ()
{
    echo ""
    echo -e "${YELLOW}network archive, Kubernetes start and deploy script for the Zero To Blockchain Series" | indent
    echo -e "${GREEN}This has been tested on Mac OSX thru High Sierra and Ubuntu V16 LTS" | indent
    echo ""
}
# get the command line options

CLUSTER_NAME="Z2B"
IP_ADDRESS="0.0.0.0"

 while getopts "h:n:" opt; 
do
    case "$opt" in
        h|\?)
        printHelp
        exit 0
        ;;
        k)  showStep "option passed for Cluster name is: '$OPTARG'" 
            if [[ $OPTARG != "" ]]; then 
                CLUSTER_NAME=$OPTARG 
            fi
        ;;
    esac
 done

function getContext ()
{
    showStep "Retrieving Cluster configuration"
    KUBECONFIG=$(bx cs cluster-config $CLUSTER_NAME | grep 'KUBECONFIG' | awk '{print $2}')
    echo "KUBECONFIG to export is $KUBECONFIG"
    export "$KUBECONFIG"

    showStep "Retrieving Kube IP Address"
    IP_ADDRESS=$(bx cs workers $CLUSTER_NAME | grep 'kube' | awk '{print $2}')
    echo "IP Address is $IP_ADDRESS"

    showStep "updating env.json"
    cat controller/env.json |  sed -i 's/\"kube_address":.".*"/"kube_address":"'$IP_ADDRESS'"/' controller/env.json
}

getContext