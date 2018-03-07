#!/bin/bash
 
. ../common_OSX.sh

CARD_SOURCE=~/.composer/*
CARD_TARGET=cards

showStep "Prepare to copy cards from $CARD_SOURCE to $CARD_TARGET"

    if [ -d $CARD_TARGET ]; then
        echo "$CARD_TARGET exists, removing"
        rm -r $CARD_TARGET 
    else
        echo "$CARD_TARGET does not exist"
    fi

showStep "Copying cards to $CARD_TARGET"
    mkdir $CARD_TARGET
    cp -r $CARD_SOURCE/* $CARD_TARGET/
    ls -AlH $CARD_TARGET