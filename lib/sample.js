/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Awaiting transaction processor function.
 * @param {org.acme.sample.AwaitingTransaction} tx The awaiting transaction instance.
 * @transaction
 */
function awaitingAccount(tx) {
    tx.account.status = "Awaiting";
      
    // Get the asset registry for the asset.
    return getAssetRegistry('org.acme.sample.Account')
        .then(function (assetRegistry) {
            // Update the asset in the asset registry.
            return assetRegistry.update(tx.account);
        })
        .then(function () {
            // Emit an event for the modified asset.
            var event = getFactory().newEvent('org.acme.sample', 'AwaitingEvent');
            event.eventName = tx.company.companyName+" has to manage this awaiting account : "+tx.account.accountName
            event.account = tx.account;
            event.company = tx.company;
            emit(event);
        });
}

/**
 * Certified transaction processor function.
 * @param {org.acme.sample.CertifiedTransaction} tx The certified transaction instance.
 * @transaction
 */
function certifiedAccount(tx) {
    tx.account.status = "Certified";
      
    if(tx.account.company.companyId != tx.company.companyId){
        // Emit an event for the modified asset.
        var event = getFactory().newEvent('org.acme.sample', 'ErrorEvent');
        event.eventName = tx.account.accountName+" can only be certified by the company: "+tx.account.company.companyName
        emit(event);
        return null
    }else{
        // Get the asset registry for the asset.
        return getAssetRegistry('org.acme.sample.Account')
            .then(function (assetRegistry) {
                // Update the asset in the asset registry.
                return assetRegistry.update(tx.account);
            })
            .then(function () {
                // Emit an event for the modified asset.
                var event = getFactory().newEvent('org.acme.sample', 'CertifiedEvent');
                event.eventName = tx.company.companyName+" has certified the account for "+tx.account.accountName
                event.account = tx.account;
                event.company = tx.company;
                emit(event);
            });
    }
}

/**
 * Rejected transaction processor function.
 * @param {org.acme.sample.RejectedTransaction} tx The rejected transaction instance.
 * @transaction
 */
function rejectedAccount(tx) {
    tx.account.status = "Rejected";

    if(tx.account.company.companyId != tx.company.companyId){
        // Emit an event for the modified asset.
        var event = getFactory().newEvent('org.acme.sample', 'ErrorEvent');
        event.eventName = tx.account.accountName+" can only be rejected by the company: "+tx.account.company.companyName
        emit(event);
        return null
    }else{
        // Get the asset registry for the asset.
        return getAssetRegistry('org.acme.sample.Account')
            .then(function (assetRegistry) {
                // Update the asset in the asset registry.
                return assetRegistry.update(tx.account);
            })
            .then(function () {
                // Emit an event for the modified asset.
                var event = getFactory().newEvent('org.acme.sample', 'RejectedEvent');
                event.eventName = tx.company.companyName+" has rejected the account for "+tx.account.accountName
                event.account = tx.account;
                event.company = tx.company;
                emit(event);
            });
    }
}