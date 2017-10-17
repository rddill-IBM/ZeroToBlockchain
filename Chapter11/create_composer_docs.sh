#!/bin/bash
 
. ../common_OSX.sh

CHAPTER_DIR=""
DIR=""
REPO_DIR=""
ADMIN_DIR="node_modules/composer-admin"
CLIENT_DIR="node_modules/composer-client"
CLI_DIR="node_modules/composer-cli"
COMMON_DIR="node_modules/composer-common"
HLFV1_DIR="node_modules/composer-connector-hlfv1"
RUNTIME_DIR="node_modules/composer-runtime"
declare -a elements=("${ADMIN_DIR}" "$CLIENT_DIR" "${COMMON_DIR}" "${HLFV1_DIR}" "${RUNTIME_DIR}")
declare -a folders=('Admin' 'Client' 'Common' 'hlfv1' 'Runtime')


# get current folder
showStep "getting current directory path"
getCurrent
CHAPTER_DIR=$DIR
showStep "Chapter dir is: ${CHAPTER_DIR}"
for i in "${elements[@]}"
do
# switch to folder
    showStep "Changing to ${i}"
    cd "${i}" 
    pwd
# generate docs
    showStep "Generating Documentation"
    if [ ! -e "jsdoc.json" ]; then
        cp jsdoc.conf jsdoc.json
    fi
    jsdoc --pedantic --recurse -c jsdoc.json
    cd ../../
done

# get current folder -1
    showStep "getting repo root folder"
    cd ../
    pwd
    getCurrent
    REPO_DIR=$DIR
    showStep "repo dir is: ${REPO_DIR}"

# remove old folders
    showStep "Removing old documentation folders"
    cd Composer_Docs
    pwd
    for i in "${folders[@]}"
    do
    # switch to folder
        showStep "removing old docs in ${i}"
        rm -rf "${i}" 
        mkdir "${i}"
    done
# copy new content
    showStep "copying new content from node_modules in ${CHAPTER_DIR} to Composer_Docs in ${pwd}"
    pwd
    count=${#elements[@]}
    for i in `seq 1 $count`
    do
        showStep "cp -R ${CHAPTER_DIR}/${elements[$i-1]}/out/ ${folders[$i-1]}"
        cp -R ${CHAPTER_DIR}/${elements[$i-1]}/out/ ${folders[$i-1]}
    done
# display message on how to access documentation
    showStep "Hyperledger Composer API documentation has been generated for your current version of Composer. 
    You can access this information by navigating to the ${GREEN}Composer_Docs${RESET} folder in your repo 
    and opening the ${GREEN}index.html${RESET} file located there in your favorite browser"