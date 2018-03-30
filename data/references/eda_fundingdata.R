#############################################
## set working directory ####################
#############################################

## this needs to change to your the directory in which
## GHSA data are stored if someone other than Steph is running this code
setwd("~/Documents/ghsa-network-analysis/data")

#############################################
## setup and load libraries #################
#############################################

## load required libraries
## if you haven't already done this, need to install package first
## (run install.packages("rjson))

library(rjson)

#############################################
## load data ################################
#############################################

dat <- fromJSON(file = "funding_data_v13.json")

#############################################
## reformat data ############################
#############################################

## pull long list of all core capacities for each project
cc <- c()
source <- c()
desc <- c()
id <- c()
donor <- c()
donor_code <- c()
recip <- c()

for(i in 1:length(dat)){
  print(i)
  cc <- c(cc, dat[[i]]$core_capacities)
  source <- c(source, dat[[i]]$source$name)
  desc <- c(desc, dat[[i]]$desc_trns)
  id <- c(id, dat[[i]]$source$id)
  donor <- c(donor, dat[[i]]$donor_name)
  donor_code <- c(donor_code, dat[[i]]$donor_code)
  recip <- c(recip, dat[[i]]$recipient_name)
}

## generate vector listing core capacities
cc_unlisted <- unlist(cc)

#############################################
## look at data data ########################
#############################################

## total number of projects tagged by core capacity
sort(table(cc_unlisted, useNA = "ifany"))

## descriptions of projects with points of entry as core capacity
head(desc[which(cc == "PoE")])

## descriptions of projects with points of entry as core capacity
head(desc[which(cc == "PoE")])

## descriptions of projects with points of entry as core capacity
table(source[which(cc == "PoE")])

################################################
## check for duplicates of white house data ####
################################################

## Austrialia funding
desc[which(donor == "Australia")]
donor_code[which(donor == "Australia")]
recip[which(donor == "Australia")]

## Korea funding: safe life for all
table(donor[grep("Korea", donor)])
desc[grep("safe", desc[which(donor == "Republic of Korea")])]
donor_code[which(donor == "Republic of Korea")]
recip[which(donor == "Republic of Korea")]

## world bank funding
table(donor[grep("Bank", donor)])
table(donor_code[grep("Bank", donor)])



