# Save format (own, versioned JSON)
`{ "format": "kairoa-save", "version": 1, ...state, "extra": {} }`. Fields the loader does not
recognise are kept verbatim under their original keys and re-emitted on save, so an untouched
save round-trips byte-for-byte after canonical key ordering.
