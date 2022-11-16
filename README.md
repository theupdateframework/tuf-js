to run the example:

1. `python3 -m http.server -d repository_data `
2. `cd examples/clientExample`
3. `npx ts-node clientExample.ts`

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
