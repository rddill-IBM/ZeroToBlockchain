#!/bin/bash

if [ "${PWD##*/}" == "delete" ]; then
    KUBECONFIG_FOLDER=${PWD}/../../kube-configs
elif [ "${PWD##*/}" == "scripts" ]; then
    KUBECONFIG_FOLDER=${PWD}/../kube-configs
else
    echo "Please run the script from 'scripts' or 'scripts/delete' folder"
fi

DELETE_VOLUMES=false
PAID=false

Parse_Arguments() {
	while [ $# -gt 0 ]; do
		case $1 in
			--paid)
				echo "Configured to setup a paid storage on ibm-cs"
				PAID=true
				;;
			--include-volumes | -i)
				DELETE_VOLUMES=true
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

if [ "${DELETE_VOLUMES}" == "true" ]; then
	echo "Deleting Persistant Storage"
	echo "Running: kubectl delete -f ${KUBECONFIG_FOLDER}/storage-${OFFERING}.yaml"
	kubectl delete -f ${KUBECONFIG_FOLDER}/storage-${OFFERING}.yaml
else
	echo "-i | --include-volumes not included in the command, will not delete storage/volumes."
fi