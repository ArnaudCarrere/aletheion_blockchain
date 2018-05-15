#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

Feature: Sample

    Background:
        Given I have deployed the business network definition ..
        And I have added the following participants of type org.acme.sample.SampleParticipant
            | participantId | name                | address                                              | siret          | touch        |
            | natixisId     | Natixis             | 30 AV PIERRE MENDES 75013 PARIS                      | 54204452400818 | To configure |
            | peugeotId     | Automobiles Peugeot | 7 RUE HENRI STE CLAIRE DEVILLE 92563 RUEIL-MALMAISON | 55214450301248 | Configured   |
        And I have added the following assets of type org.acme.sample.SampleAsset
            | assetId | owner          | companyName  | iban                        | status   |
            | 1       | peugeotId      | PEUGEOT IVRY | FR7630004015870002601171220 | Awaiting |
        And I have issued the participant org.acme.sample.SampleParticipant#peugeotId with the identity peugeot1
        And I have issued the participant org.acme.sample.SampleParticipant#natixisId with the identity natixis1
            
    Scenario: Peugeot can submit a transaction for its assets
        When I use the identity peugeot1
        And I submit the following transaction of type org.acme.sample.SampleTransaction
            | assetId | new status |
            | 1       | Certified  |
        Then I should have the following assets of type org.acme.sample.SampleAsset
            | assetId | owner          | companyName  | iban                        | status   |
            | 1       | peugeotId      | PEUGEOT IVRY | FR7630004015870002601171220 | Certified |
        And I should have received the following event of type org.acme.sample.SampleEvent
            | asset   | oldStatus      | newStatus |
            | 1       | Awaiting       | Certified | 
        
    Scenario: Natixis cannot update Peugeot's assets
        When I use the identity natixis1
        And I update the following asset of type org.acme.sample.SampleAsset
            | assetId | owner          | companyName  | iban                        | status   |
            | 1       | peugeotId      | PEUGEOT IVRY | FR7630004015870002601171220 | Awaiting |
        Then I should get an error matching /does not have .* access to resource/

    Scenario: Natixis cannot submit a transaction for Peugeot's assets
        When I use the identity natixis1
        And I submit the following transaction of type org.acme.sample.SampleTransaction
            | assetId | new status |
            | 1       | Certified  |
        Then I should get an error matching /does not have .* access to resource/