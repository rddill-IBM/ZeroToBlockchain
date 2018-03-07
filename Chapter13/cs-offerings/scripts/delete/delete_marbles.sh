#!/bin/bash
if [ "${PWD##*/}" == "delete" ]; then
    KUBECONFIG_FOLDER=${PWD}/../../kube-configs
elif [ "${PWD##*/}" == "scripts" ]; then
    KUBECONFIG_FOLDER=${PWD}/../kube-configs
else
    echo "Please run the script from 'scripts' or 'scripts/delete' folder"
fi

PAID=false

Parse_Arguments() {
	while [ $# -gt 0 ]; do
		case $1 in
			--paid)
				echo "Configured to setup a paid storage on ibm-cs"
				PAID=true
				;;
		esac
		shift
	done
}

Parse_Arguments $@

if [ "${PAID}" == "true" ]; then
	OFFERING="paid"
else
	OFFERING="free"
fi

echo "Deleting marbles service"
echo "Running: kubectl delete -f ${KUBECONFIG_FOLDER}/marbles-services-${OFFERING}.yaml"
kubectl delete -f ${KUBECONFIG_FOLDER}/marbles-services-${OFFERING}.yaml

sleep 15

echo "Deleting marbles pod"
echo "Running: kubectl delete -f ${KUBECONFIG_FOLDER}/marbles.yaml"
kubectl delete -f ${KUBECONFIG_FOLDER}/marbles.yaml
