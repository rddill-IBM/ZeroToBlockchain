#!/bin/bash

ORG=""
CLUSTER_NAME=""
PAID="false"

Usage() {
	echo ""
	echo "Usage: ./generate-connection-profile.sh -o <org1|org2> -c <cluster-name> [--paid]"
	echo ""
	echo "Options:"
	echo -e "\t-o or --organization:\torg1 or org2 based on what organization you want the connection profile for."
	echo -e "\t-c or --cluster:\tthe ibm-container service cluster name."
	echo -e "\t--paid:\t\t\tif you are using a paid cluster"
	echo ""
	echo "Example: ./generate-connection-profile.sh -o org1 -c blockchain"
	echo ""
	exit 1
}

Parse_Arguments() {
	while [ $# -gt 0 ]; do
		case $1 in
			--organization | -o)
				shift
				ORG="$1"
				;;
			--cluster-name | -c)
				shift
				CLUSTER_NAME=$1
				;;
			--paid)
				PAID=true
				;;
		esac
		shift
	done
}
Parse_Arguments $@

if [ "$ORG" == "" ] || [ "$CLUSTER_NAME" == "" ];then
	Usage
fi

if [ "${ORG}" == "org1" ]; then
	MSP="Org1MSP"
	PEER="org1peer1"
elif [ "${ORG}" == "org2" ]; then
	MSP="Org2MSP"
	PEER="org2peer1"
else
	Usage
fi

if [ "${PAID}" == "true" ]; then
	ORDERER_ADDRESS=$(kubectl get svc | grep orderer | awk '{print $3}')
	org1PEER1_ADDRESS=$(kubectl get svc | grep org1peer1 | awk '{print $3}')
	org2PEER1_ADDRESS=$(kubectl get svc | grep org2peer1 | awk '{print $3}')
	CA_ADDRESS=$(kubectl get svc | grep "blockchain-ca" | awk '{print $3}')

	echo "orderer address: ${ORDERER_ADDRESS}"
	echo "org1peer1 address: ${org1PEER1_ADDRESS}"
	echo "org2peer1 address: ${org2PEER1_ADDRESS}"
	echo "ca address: ${CA_ADDRESS}"
else
	PUBLIC_ADDRESS=$(bx cs workers ${CLUSTER_NAME} | tail -1 | awk '{print $2}')
	echo "Public address for cluster is: ${PUBLIC_ADDRESS}"
	ORDERER_ADDRESS=${PUBLIC_ADDRESS}
	org1PEER1_ADDRESS=${PUBLIC_ADDRESS}
	org2PEER1_ADDRESS=${PUBLIC_ADDRESS}
	CA_ADDRESS=${PUBLIC_ADDRESS}	
fi


PEER_CONTAINER_NAME=$(kubectl get pods -a | grep ${PEER} | awk '{print $1}')
echo "Container for ${ORG}peer1 is ${PEER_CONTAINER_NAME}"
ADMIN_PRIVATE_KEY=$(kubectl exec ${PEER_CONTAINER_NAME} cat /shared/crypto-config/peerOrganizations/${ORG}.example.com/users/Admin@${ORG}.example.com/msp/keystore/key.pem)
ADMIN_PUBLIC_KEY=$(kubectl exec ${PEER_CONTAINER_NAME} cat /shared/crypto-config/peerOrganizations/${ORG}.example.com/users/Admin@${ORG}.example.com/msp/signcerts/Admin@${ORG}.example.com-cert.pem )

echo "admin private key is ${ADMIN_PRIVATE_KEY}"
echo "admin public key is ${ADMIN_PUBLIC_KEY}"

ADMIN_PRIVATE_KEY_ONELINE=$(echo "${ADMIN_PRIVATE_KEY//$'\n'/\\\r\\\n}\\\r\\\n")
ADMIN_PUBLIC_KEY_ONELINE=$(echo "${ADMIN_PUBLIC_KEY//$'\n'/\\\r\\\n}\\\r\\\n")

# echo "admin private key one line is ${ADMIN_PRIVATE_KEY_ONELINE}"
# echo "admin public key one line is ${ADMIN_PUBLIC_KEY_ONELINE}"

if [ "${ORG}" == "org1" ] || [ "${ORG}" == "org2" ];then
	PEER1_ADDRESS_=${ORG}PEER1_ADDRESS
	PEER1_ADDRESS=${!PEER1_ADDRESS_}

	echo "PEER1_ADDRESS_ is ${PEER1_ADDRESS_}"
	echo "PEER1_ADDRESS is ${PEER1_ADDRESS}"

	echo "Setting the json for ${ORG}"
	cp connection-profile-${ORG}.json.tmpl connection-profile-${ORG}.json

	OLD_STRING="ADMINPRIVATEKEY"
	sed -i "" "s|${OLD_STRING}|${ADMIN_PRIVATE_KEY_ONELINE}|g" connection-profile-${ORG}.json
	
	OLD_STRING="ADMINPUBLICKEY"
	sed -i "" "s|${OLD_STRING}|${ADMIN_PUBLIC_KEY_ONELINE}|g" connection-profile-${ORG}.json
	
	OLD_STRING="ORDERER-PUBLICIP"
	sed -i "" "s|${OLD_STRING}|${ORDERER_ADDRESS}|g" connection-profile-${ORG}.json

	OLD_STRING="${ORG}PEER1-PUBLICIP"
	sed -i "" "s|${OLD_STRING}|${PEER1_ADDRESS}|g" connection-profile-${ORG}.json

	OLD_STRING="CA-PUBLICIP"
	sed -i "" "s|${OLD_STRING}|${CA_ADDRESS}|g" connection-profile-${ORG}.json

	echo "Check the profile: connection-profile-${ORG}.json"
fi