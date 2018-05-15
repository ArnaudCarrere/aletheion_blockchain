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

'use strict';

const AdminConnection = require('composer-admin').AdminConnection;
const BrowserFS = require('browserfs/dist/node/index');
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const path = require('path');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

const bfs_fs = BrowserFS.BFSRequire('fs');

describe('Sample', () => {

    // This is the business network connection the tests will use.
    let businessNetworkConnection;

    // This is the factory for creating instances of types.
    let factory;

    // These are the identities for Alice and Bob.
    let totalIdentity;
    let peugeotIdentity;

    // These are a list of received events.
    let events;

    // This is called before each test is executed.
    beforeEach(() => {

        // Initialize an in-memory file system, so we do not write any files to the actual file system.
        BrowserFS.initialize(new BrowserFS.FileSystem.InMemory());

        // Create a new admin connection.
        const adminConnection = new AdminConnection({ fs: bfs_fs });

        // Create a new connection profile that uses the embedded (in-memory) runtime.
        return adminConnection.createProfile('defaultProfile', { type : 'embedded' })
            .then(() => {

                // Establish an admin connection. The user ID must be admin. The user secret is
                // ignored, but only when the tests are executed using the embedded (in-memory)
                // runtime.
                return adminConnection.connect('defaultProfile', 'admin', 'adminpw');

            })
            .then(() => {

                // Generate a business network definition from the project directory.
                return BusinessNetworkDefinition.fromDirectory(path.resolve(__dirname, '..'));

            })
            .then((businessNetworkDefinition) => {

                // Deploy and start the business network defined by the business network definition.
                return adminConnection.deploy(businessNetworkDefinition);

            })
            .then(() => {

                // Create and establish a business network connection
                businessNetworkConnection = new BusinessNetworkConnection({ fs: bfs_fs });
                events = [];
                businessNetworkConnection.on('event', (event) => {
                    events.push(event);
                });
                return businessNetworkConnection.connect('defaultProfile', 'basic-sample-network', 'admin', 'adminpw');

            })
            .then(() => {

                // Get the factory for the business network.
                factory = businessNetworkConnection.getBusinessNetwork().getFactory();

                // Create the participants.
                const peugeot = factory.newResource('org.acme.sample', 'Company', 'peugeotId');
                peugeot.companyName = 'Automobiles Peugeot';
                peugeot.address = '7 RUE HENRI STE CLAIRE DEVILLE 92563 RUEIL-MALMAISON';
                peugeot.siret = 55214450301248;
                peugeot.touch = 'To configure';
                const total = factory.newResource('org.acme.sample', 'Company', 'totalId');
                total.companyName = 'Total SA';
                total.address = '2 PL JEAN MILLIER 92400 COURBEVOIE';
                total.siret = 54205118000066;
                total.touch = 'To configure';
                return businessNetworkConnection.getParticipantRegistry('org.acme.sample.Company')
                    .then((participantRegistry) => {
                        participantRegistry.addAll([peugeot, total]);
                    });

            })
            .then(() => {

                // Create the assets.
                const asset1 = factory.newResource('org.acme.sample', 'Account', '1');
                asset1.company = factory.newRelationship('org.acme.sample', 'Company', 'peugeotId');
                asset1.accountName = 'PEUGEOT IVRY';
                asset1.iban = 'FR7630004015870002601171220';
                asset1.status = 'Awaiting';
                const asset2 = factory.newResource('org.acme.sample', 'Account', '2');
                asset2.company = factory.newRelationship('org.acme.sample', 'Company', 'totalId');
                asset1.accountName = 'TOTAL TOULOUSE';
                asset1.iban = 'FR7630009015875562601171444';
                asset1.status = 'Awaiting';
                return businessNetworkConnection.getAssetRegistry('org.acme.sample.Account')
                    .then((assetRegistry) => {
                        assetRegistry.addAll([asset1, asset2]);
                    });
            })
            .then(() => {

                // Issue the identities.
                return businessNetworkConnection.issueIdentity('org.acme.sample.Company#peugeotId', 'peugeot1')
                    .then((identity) => {
                        peugeotIdentity = identity;
                        return businessNetworkConnection.issueIdentity('org.acme.sample.Company#totalId', 'total1');
                    })
                    .then((identity) => {
                        totalIdentity = identity;
                    });

            });

    });

    /**
     * Reconnect using a different identity.
     * @param {Object} identity The identity to use.
     * @return {Promise} A promise that will be resolved when complete.
     */
    function useIdentity(identity) {
        return businessNetworkConnection.disconnect()
            .then(() => {
                businessNetworkConnection = new BusinessNetworkConnection({ fs: bfs_fs });
                events = [];
                businessNetworkConnection.on('event', (event) => {
                    events.push(event);
                });
                return businessNetworkConnection.connect('defaultProfile', 'basic-sample-network', identity.userID, identity.userSecret);
            });
    }

    it('Peugeot can read all of the accounts', () => {

        // Use the identity for Peugeot.
        return useIdentity(peugeotIdentity)
            .then(() => {

                // Get the assets.
                return businessNetworkConnection.getAssetRegistry('org.acme.sample.Account')
                    .then((assetRegistry) => {
                        return assetRegistry.getAll();

                    });

            })
            .then((assets) => {

                // Validate the assets.
                assets.should.have.lengthOf(2);
                const asset1 = assets[0];
                asset1.company.getFullyQualifiedIdentifier().should.equal('org.acme.sample.Company#peugeotId');
                asset1.status.should.equal('Awaiting');
                const asset2 = assets[1];
                asset2.company.getFullyQualifiedIdentifier().should.equal('org.acme.sample.Company#totalId');
                asset2.value.should.equal('Awaiting');

            });

    });

    it('Total can read all of the accounts', () => {

        // Use the identity for Peugeot.
        return useIdentity(peugeotIdentity)
            .then(() => {

                // Get the assets.
                return businessNetworkConnection.getAssetRegistry('org.acme.sample.Account')
                    .then((assetRegistry) => {
                        return assetRegistry.getAll();

                    });

            })
            .then((assets) => {

                // Validate the assets.
                assets.should.have.lengthOf(2);
                const asset1 = assets[0];
                asset1.company.getFullyQualifiedIdentifier().should.equal('org.acme.sample.Company#peugeotId');
                asset1.status.should.equal('Awaiting');
                const asset2 = assets[1];
                asset2.company.getFullyQualifiedIdentifier().should.equal('org.acme.sample.Company#totalId');
                asset2.value.should.equal('Awaiting');

            });

    });

    it('Peugeot can certify its accounts', () => {

        // Use the identity for Peugeot.
        return useIdentity(peugeotIdentity)
            .then(() => {

                // Submit the transaction.
                const transaction = factory.newTransaction('org.acme.sample', 'CertifiedTransaction');
                transaction.account = factory.newRelationship('org.acme.sample', 'Account', '1');
                transaction.company = factory.newRelationship('org.acme.sample', 'Company', 'peugeotId');
                return businessNetworkConnection.submitTransaction(transaction);

            })
            .then(() => {

                // Get the asset.
                return businessNetworkConnection.getAssetRegistry('org.acme.sample.Account')
                    .then((assetRegistry) => {
                        return assetRegistry.get('1');
                    });

            })
            .then((asset1) => {

                // Validate the asset.
                asset1.company.getFullyQualifiedIdentifier().should.equal('org.acme.sample.Company#peugeotId');
                asset1.status.should.equal('Certified');

                // Validate the events.
                events.should.have.lengthOf(1);
                const event = events[0];
                event.eventId.should.be.a('string');
                event.account.getFullyQualifiedIdentifier().should.equal('org.acme.sample.Account#1');
                event.company.getFullyQualifiedIdentifier().should.equal('org.acme.sample.Company#peugeotId');

            });

    });

    it('Peugeot cannot certify a Total\'s account', () => {

        // Use the identity for Peugeot.
        return useIdentity(peugeotIdentity)
            .then(() => {

                // Submit the transaction.
                const transaction = factory.newTransaction('org.acme.sample', 'CertifiedTransaction');
                transaction.account = factory.newRelationship('org.acme.sample', 'Account', '1');
                transaction.company = factory.newRelationship('org.acme.sample', 'Company', 'peugeotId');
                return businessNetworkConnection.submitTransaction(transaction);

            })
            .should.be.rejectedWith(/does not have .* access to resource/);

    });

    it('Total can certify its accounts', () => {

        // Use the identity for Total.
        return useIdentity(totalIdentity)
            .then(() => {

                // Submit the transaction.
                const transaction = factory.newTransaction('org.acme.sample', 'CertifiedTransaction');
                transaction.account = factory.newRelationship('org.acme.sample', 'Account', '2');
                transaction.company = factory.newRelationship('org.acme.sample', 'Company', 'totalId');
                return businessNetworkConnection.submitTransaction(transaction);

            })
            .then(() => {

                // Get the asset.
                return businessNetworkConnection.getAssetRegistry('org.acme.sample.Account')
                    .then((assetRegistry) => {
                        return assetRegistry.get('2');
                    });

            })
            .then((asset2) => {

                // Validate the asset.
                asset2.owner.getFullyQualifiedIdentifier().should.equal('org.acme.sample.Company#totalId');
                asset2.value.should.equal('Certified');

                // Validate the events.
                events.should.have.lengthOf(1);
                const event = events[0];
                event.eventId.should.be.a('string');
                event.account.getFullyQualifiedIdentifier().should.equal('org.acme.sample.Account#2');
                event.company.getFullyQualifiedIdentifier().should.equal('org.acme.sample.Company#totalId');

            });

    });

    it('Total cannot certify a Peugeot\'s account', () => {

        // Use the identity for Total.
        return useIdentity(totalIdentity)
            .then(() => {

                // Submit the transaction.
                const transaction = factory.newTransaction('org.acme.sample', 'CertifiedTransaction');
                transaction.account = factory.newRelationship('org.acme.sample', 'Account', '2');
                transaction.company = factory.newRelationship('org.acme.sample', 'Company', 'totalId');
                return businessNetworkConnection.submitTransaction(transaction);

            })
            .should.be.rejectedWith(/does not have .* access to resource/);

    });

    it('Peugeot can reject its accounts', () => {

        // Use the identity for Peugeot.
        return useIdentity(peugeotIdentity)
            .then(() => {

                // Submit the transaction.
                const transaction = factory.newTransaction('org.acme.sample', 'RejectedTransaction');
                transaction.account = factory.newRelationship('org.acme.sample', 'Account', '1');
                transaction.company = factory.newRelationship('org.acme.sample', 'Company', 'peugeotId');
                return businessNetworkConnection.submitTransaction(transaction);

            })
            .then(() => {

                // Get the asset.
                return businessNetworkConnection.getAssetRegistry('org.acme.sample.Account')
                    .then((assetRegistry) => {
                        return assetRegistry.get('1');
                    });

            })
            .then((asset1) => {

                // Validate the asset.
                asset1.company.getFullyQualifiedIdentifier().should.equal('org.acme.sample.Company#peugeotId');
                asset1.status.should.equal('Rejected');

                // Validate the events.
                events.should.have.lengthOf(1);
                const event = events[0];
                event.eventId.should.be.a('string');
                event.account.getFullyQualifiedIdentifier().should.equal('org.acme.sample.Account#1');
                event.company.getFullyQualifiedIdentifier().should.equal('org.acme.sample.Company#peugeotId');

            });

    });

    it('Peugeot cannot reject a Total\'s account', () => {

        // Use the identity for Peugeot.
        return useIdentity(peugeotIdentity)
            .then(() => {

                // Submit the transaction.
                const transaction = factory.newTransaction('org.acme.sample', 'RejectedTransaction');
                transaction.account = factory.newRelationship('org.acme.sample', 'Account', '1');
                transaction.company = factory.newRelationship('org.acme.sample', 'Company', 'peugeotId');
                return businessNetworkConnection.submitTransaction(transaction);

            })
            .should.be.rejectedWith(/does not have .* access to resource/);

    });

    it('Total can reject its accounts', () => {

        // Use the identity for Total.
        return useIdentity(totalIdentity)
            .then(() => {

                // Submit the transaction.
                const transaction = factory.newTransaction('org.acme.sample', 'RejectedTransaction');
                transaction.account = factory.newRelationship('org.acme.sample', 'Account', '2');
                transaction.company = factory.newRelationship('org.acme.sample', 'Company', 'totalId');
                return businessNetworkConnection.submitTransaction(transaction);

            })
            .then(() => {

                // Get the asset.
                return businessNetworkConnection.getAssetRegistry('org.acme.sample.Account')
                    .then((assetRegistry) => {
                        return assetRegistry.get('2');
                    });

            })
            .then((asset2) => {

                // Validate the asset.
                asset2.owner.getFullyQualifiedIdentifier().should.equal('org.acme.sample.Company#totalId');
                asset2.value.should.equal('Rejected');

                // Validate the events.
                events.should.have.lengthOf(1);
                const event = events[0];
                event.eventId.should.be.a('string');
                event.account.getFullyQualifiedIdentifier().should.equal('org.acme.sample.Account#2');
                event.company.getFullyQualifiedIdentifier().should.equal('org.acme.sample.Company#totalId');

            });

    });

    it('Total cannot reject a Peugeot\'s account', () => {

        // Use the identity for Total.
        return useIdentity(totalIdentity)
            .then(() => {

                // Submit the transaction.
                const transaction = factory.newTransaction('org.acme.sample', 'RejectedTransaction');
                transaction.account = factory.newRelationship('org.acme.sample', 'Account', '2');
                transaction.company = factory.newRelationship('org.acme.sample', 'Company', 'totalId');
                return businessNetworkConnection.submitTransaction(transaction);

            })
            .should.be.rejectedWith(/does not have .* access to resource/);

    });

});
