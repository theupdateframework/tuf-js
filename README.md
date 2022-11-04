to run the example hitting local tuf server:

1. `python3 -m http.server -d tuf_local_data`
2. go to another terminal`cd examples/clientExample`
3. `npx ts-node clientExample.ts $filename`

to run the example hitting sigstore remote tuf server:

1. go to another terminal`cd examples/clientExample`
2. `npx ts-node clientExample.ts $filename`

## Data Model

```mermaid
classDiagram

class Metadata {
    +Signed signed
    +Record~string,Signature~ signatures
    +verifyDelegate(string role, Metadata metadata)

}

class Signature {
    +string keyID
    +string sig
}
class Signed {
    +string specVersion
    +number version
    +string expires
}

class Root{
    +Record~string,Key~ keys
    +Record~string,Role~ roles
}

class Timestamp{
    +MetaFile snapshotMeta
}

class Snapshot{
    +Record~string,MetaFile~ meta
}

class Targets{
    +Record~string,TargetFile~ targets
    +Delegations delegations
}

class Key{
    +string keyID
    +string keyType
    +string scheme
    +Record~string,string~ keyVal
    +verifySignature(Metadata meta)
}

class Role{
    +string[] keyIDs
    +number threshold
}

class MetaFile{
    +number version
    +number length
    +Record~string,string~ hashes
    +verify(Buffer data)
}

class Delegations{
    +Record~string,Key~ keys
    +Record~string,DelegatedRole~ roles
    +rolesForTarget(string target) string[]
}

class DelegatedRole{
    +string name
    +boolean terminating
    +string[] paths
    +string[] pathHashPrefixes
    +isDelegatedPath(string target) boolean
}

class TargetFile{
    +number length
    +string path
    +Record~string,string~ hashes
    +verify(Buffer data)
}

Metadata --o "1" Signed
Metadata --o "*" Signature
Signed <|-- Root
Signed <|-- Timestamp
Signed <|-- Snapshot
Signed <|-- Targets
Root --o "*" Key
Root --o "*" Role
Timestamp --o "1" MetaFile
Snapshot --o "*" MetaFile
Targets --o "1" Delegations
Targets --o "*" TargetFile
Delegations --o "*" Key
Delegations --o "*" DelegatedRole
DelegatedRole <|-- Role

```
