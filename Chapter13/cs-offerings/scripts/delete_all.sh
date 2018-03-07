#!/bin/bash
if [ "${PWD##*/}" == "create" ]; then
	:
elif [ "${PWD##*/}" == "scripts" ]; then
	:
else
    echo "Please run the script from 'scripts' or 'scripts/create' folder"
fi

echo ""
echo "=> DELETE_ALL: Deleting blockchain"
./delete/delete_blockchain.sh $@

echo ""
echo "=> DELETE_ALL: Deleting create and join channel pods"
./delete/delete_channel-pods.sh

echo ""
echo "=> DELETE_ALL: Deleting composer playground"
./delete/delete_composer-playground.sh $@

echo ""
echo "=> DELETE_ALL: Deleting composer rest server"
./delete/delete_composer-rest-server.sh $@

echo ""
echo "=> DELETE_ALL: Deleting install chaincode pod"
./delete/delete_chaincode-install.sh

echo ""
echo "=> DELETE_ALL: Deleting instantiate chaincode pod"
./delete/delete_chaincode-instantiate.sh

echo ""
echo "=> DELETE_ALL: Wiping the shared folder empty"
./wipe_shared.sh

echo ""
echo "=> DELETE_ALL: Deleting persistent volume - call."
./delete/delete_storage.sh $@
