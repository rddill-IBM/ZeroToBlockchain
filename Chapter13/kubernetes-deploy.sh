#!/bin/bash
 
. ../common_OSX.sh

function printHelp ()
{
    printHeader
    echo ""
    echo -e "${RESET} options for this exec are: "
    echo -e "${GREEN}-h ${RESET}Print this help information" | indent
    echo -e "${GREEN}-n ${RESET}defaults to ${GREEN}zerotoblockchain-network${RESET}. use ${YELLOW}-n your-named-network ${RESET}if you are using a different network name"  | indent
    echo -e "\t\tyou will have to ensure that the name you use here is also the name you use in BOTH package.json files and in your application code" | indent
    echo -e "${GREEN}-c ${RESET}defaults to ${GREEN}PeerAdmin.card${RESET}. use ${YELLOW}-c your-PEERADMIN.card-name ${RESET}if you are using a different PeerAdmin card"  | indent
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

NETWORK_NAME="zerotoblockchain-network"
CLUSTER_NAME="Z2B"
PEERADMIN_CARD=PeerAdmin.card
CARD_SOURCE=~/.composer
CARD_TARGET=cards
IP_ADDRESS="0.0.0.0"

 while getopts "h:n:" opt; 
do
    case "$opt" in
        h|\?)
        printHelp
        exit 0
        ;;
        n)  showStep "option passed for network name is: '$OPTARG'" 
            if [[ $OPTARG != "" ]]; then 
                NETWORK_NAME=$OPTARG 
            fi
        ;;
        c)  showStep "option passed for PeerAdmin.card name is: '$OPTARG'" 
            if [[ $OPTARG != "" ]]; then 
                PEERADMIN_CARD=$OPTARG 
            fi
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

    showStep "updating env.json for $OS"
    if [[ $OS == "Darwin" ]]; then
        echo "updating for OSX"
        cat controller/env.json |  sed -i '.bak' 's/\"kube_address":".*"/"kube_address":"'$IP_ADDRESS'"/' controller/env.json
    else
        echo "updating for Linux"
        cat controller/env.json |  sed -i 's/\"kube_address":".*"/"kube_address":"'$IP_ADDRESS'"/' controller/env.json
    fi
}

function clearOldCards ()
{
    showStep "Clearing old cards"
    if [ -d ~/.composer/cards ]; then
        rm -r ~/.composer/cards 
    fi
    if [ -d $CARD_TARGET ]; then
        rm -r $CARD_TARGET 
    fi
    if [ -d ~/.composer/client-data ]; then
        rm -r ~/.composer/client-data
    fi
    if [ -e PeerAdmin.card ]; then
        rm PeerAdmin.card
    fi
    if [ -e PeerAdmin.card.orig ]; then
        rm PeerAdmin.card.orig
    fi
}

function setupCluster ()
{
    showStep "deleting current fabric containers"
    pushd ./cs-offerings/scripts/
    ./delete_all.sh
    showStep "creating new fabric containers"
    ./create_all.sh --with-couchdb
    popd

}

function pauseForCard ()
{
    CURRENT=$(pwd)
    echo -e "${RESET} pausing while you go to composer playground and download the PeerAdmin card."
    echo -e "${GREEN}You can access the playground at ==> http://$IP_ADDRESS:31080${RESET}"
    echo -e "Click on ${GREEN}Launch Now${RESET} and then ${GREEN}export the PeerAdmin card ${RESET}"
    echo -e "after downloading the PeerAdmin card, ${GREEN}please copy it into your $CURRENT folder.${RESET}"

    if [ ! -f $PEERADMIN_CARD ]; then
        echo "$PEERADMIN_CARD does not exist"
    else
        echo "$PEERADMIN_CARD does exist"
    fi 
    while [ ! -f $PEERADMIN_CARD ]; do
        if [ $(which xdg-open | grep 'xdg-open' -c ) -eq 0 ]; then
            open http://$IP_ADDRESS:31080
        else 
            xdg-open http://$IP_ADDRESS:31080
        fi
    read -n1 -r -p "And then press any key to continue..." key
    done
}

function updateCard ()
{
    showStep "updating $CURRENT/$PEERADMIN_CARD"
    pushd ./cs-offerings/scripts/connection-profile
    ./update_card.sh -c $CURRENT/$PEERADMIN_CARD -a $IP_ADDRESS
    popd
    composer card import --file $PEERADMIN_CARD
    composer card list
    rm $PEERADMIN_CARD
    rm $PEERADMIN_CARD.orig
}

function installNetwork()
{
    showStep "Starting network install"
    pushd network/dist
    echo $(pwd)
    if [ -e admin.card ]; then
        rm admin.card
    fi
    if [ -e admin.card.orig ]; then
        rm admin.card.orig
    fi
    showStep "Installing $NETWORK_NAME"
    composer runtime install --card PeerAdmin@hlfv1 --businessNetworkName $NETWORK_NAME
    showStep "starting $NETWORK_NAME"
    composer network start -c PeerAdmin@hlfv1 -A admin -S adminpw -a $NETWORK_NAME.bna --file admin.card
    showStep "importing admin.card into $NETWORK_NAME"
    composer card import --file admin.card
    showStep "pinging network. This activates the admin card"
    composer network ping -c admin@$NETWORK_NAME
    showStep "extracting connection profile"
    unzip admin.card
    rm -r ./credentials
    rm metadata.json
    mv -y connection.json ../../controller
    rm connection.json
    showStep "clean up installation"
    rm admin.card
    rm admin.card.orig
    popd
    composer card list
    showStep "saving cards in $CARD_SOURCE to $CARD_TARGET"
    cp -r $CARD_SOURCE $CARD_TARGET
    showStep "listing $CARD_TARGET"
    ls $CARD_TARGET
    showStep "installNetwork complete"
}

# Core Logic
    showStep "creating archive"
    ./createArchive.sh -n $NETWORK_NAME
    getContext
    clearOldCards
    setupCluster
    pauseForCard
    updateCard
    ./getPEM.sh
    installNetwork
