## REMOVED Requirements

### Requirement: Sections retired by a later wave keep resolving

**Reason**: This is the wave that retires them. The requirement held that the
Data Hub and Extensions section URLs resolve "to their own panels with no
redirect and no interstitial", which is the direct negation of this change's
"The retired connection surfaces resolve to the Connections page" — both specs
were live at once, describing a state no implementation can satisfy, and the
code implements the redirect. It was written to keep the two sections working
while the Connections page was built; both panels are now deleted, so nothing
remains for either URL to resolve to.
