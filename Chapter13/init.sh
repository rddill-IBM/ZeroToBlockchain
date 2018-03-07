#!/bin/bash

# exec to run on IBM Cloud to start dispute resolution nodejs environment
SOURCE_DIR=controller/restapi/features/composer/creds
TARGET_DIR=~/.hfc-key-store
CARD_TARGET=~/.composer
CARD_SOURCE=cards


if [ -d $TARGET_DIR ]; then
    echo "emptying $TARGET_DIR"
    rm -r $TARGET_DIR
    mkdir $TARGET_DIR
else
    echo "$TARGET_DIR does not exist"
    mkdir $TARGET_DIR
fi

ls -AlH $TARGET_DIR

# copy cards to ~.hfc-key-store

echo "copy cards from $SOURCE_DIR to $TARGET_DIR"
cp $SOURCE_DIR/* $TARGET_DIR

# list contents in ~/.hfc-key-store

echo "listing contents of $TARGET_DIR"
ls -AlH $TARGET_DIR

# copy cards to ~/.composer

echo "copying admin and PeerAdmin cards to $CARD_TARGET"
if [ -d $CARD_TARGET ]; then
    echo "emptying $CARD_TARGET"
    rm -r $CARD_TARGET
    mkdir $CARD_TARGET
else
    echo "$CARD_TARGET does not exist"
    mkdir $CARD_TARGET
fi
echo "copying $CARD_SOURCE/* to $CARD_TARGET/"
cp -r $CARD_SOURCE/* $CARD_TARGET
echo "attempting to list contents of $CARD_TARGET"
ls -AlH $CARD_TARGET

# start nodejs index.js

echo "starting the app"
node index.js