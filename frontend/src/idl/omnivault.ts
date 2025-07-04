/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/omnivault.json`.
 */
export type Omnivault = {
  "address": "BxpNexvSRuUoaSwdff5aEmCGX7LBDhGPtA79VVraPtqr",
  "metadata": {
    "name": "omnivault",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "OmniVault: Cross-Chain Yield Optimizer"
  },
  "instructions": [
    {
      "name": "createVault",
      "docs": [
        "Create a new vault with specified risk profile and strategy"
      ],
      "discriminator": [
        29,
        237,
        247,
        208,
        193,
        82,
        54,
        135
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "vault_store.total_vaults",
                "account": "vaultStore"
              }
            ]
          }
        },
        {
          "name": "yieldTracker",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  121,
                  105,
                  101,
                  108,
                  100,
                  95,
                  116,
                  114,
                  97,
                  99,
                  107,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "vaultStore",
          "writable": true
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "riskProfile",
          "type": {
            "defined": {
              "name": "riskProfile"
            }
          }
        },
        {
          "name": "minDeposit",
          "type": "u64"
        },
        {
          "name": "targetChains",
          "type": {
            "vec": "u16"
          }
        }
      ]
    },
    {
      "name": "deposit",
      "docs": [
        "Deposit tokens into a vault with automatic yield optimization trigger"
      ],
      "discriminator": [
        242,
        35,
        198,
        137,
        82,
        225,
        242,
        182
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "userPosition",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "vaultStore"
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "vaultTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "depositSol",
      "docs": [
        "Deposit native SOL into a vault"
      ],
      "discriminator": [
        108,
        81,
        78,
        117,
        125,
        155,
        56,
        200
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "userPosition",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "vaultStore"
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "emergencyPause",
      "docs": [
        "Emergency pause system (admin only)"
      ],
      "discriminator": [
        21,
        143,
        27,
        142,
        200,
        181,
        210,
        255
      ],
      "accounts": [
        {
          "name": "vaultStore",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "vaultStore"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "initialize",
      "docs": [
        "Initialize the OmniVault program"
      ],
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "vaultStore",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  115,
                  116,
                  111,
                  114,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "lzReceive",
      "docs": [
        "Receive cross-chain yield data and trigger rebalancing if needed"
      ],
      "discriminator": [
        8,
        179,
        120,
        109,
        33,
        118,
        189,
        80
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "yieldTracker",
          "writable": true
        },
        {
          "name": "endpoint"
        },
        {
          "name": "oappConfig"
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "srcChainId",
          "type": "u16"
        },
        {
          "name": "payload",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "lzReceiveTypes",
      "docs": [
        "Get vault types for LayerZero receive instruction"
      ],
      "discriminator": [
        221,
        17,
        246,
        159,
        248,
        128,
        31,
        96
      ],
      "accounts": [
        {
          "name": "vault"
        },
        {
          "name": "yieldTracker"
        },
        {
          "name": "endpoint"
        },
        {
          "name": "oappConfig"
        },
        {
          "name": "payer",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "srcChainId",
          "type": "u16"
        }
      ]
    },
    {
      "name": "queryCrossChainYields",
      "docs": [
        "Send cross-chain yield query via LayerZero"
      ],
      "discriminator": [
        244,
        60,
        28,
        159,
        70,
        94,
        26,
        218
      ],
      "accounts": [
        {
          "name": "vault"
        },
        {
          "name": "yieldTracker",
          "writable": true
        },
        {
          "name": "endpoint"
        },
        {
          "name": "oappConfig"
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "targetChains",
          "type": {
            "vec": "u16"
          }
        }
      ]
    },
    {
      "name": "rebalanceVault",
      "docs": [
        "Manual rebalance vault strategy (admin only)"
      ],
      "discriminator": [
        222,
        228,
        121,
        242,
        30,
        212,
        201,
        145
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "vaultStore"
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "targetChain",
          "type": "u16"
        }
      ]
    },
    {
      "name": "resumeOperations",
      "docs": [
        "Resume system operations (admin only)"
      ],
      "discriminator": [
        240,
        141,
        133,
        154,
        232,
        15,
        166,
        157
      ],
      "accounts": [
        {
          "name": "vaultStore",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "vaultStore"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "updateVaultConfig",
      "docs": [
        "Update vault configuration (owner only)"
      ],
      "discriminator": [
        122,
        3,
        21,
        222,
        158,
        255,
        238,
        157
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "vault"
          ]
        }
      ],
      "args": [
        {
          "name": "newMinDeposit",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "newActiveStatus",
          "type": {
            "option": "bool"
          }
        },
        {
          "name": "newRebalanceThreshold",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "newTargetChains",
          "type": {
            "option": {
              "vec": "u16"
            }
          }
        }
      ]
    },
    {
      "name": "withdraw",
      "docs": [
        "Withdraw tokens from a vault"
      ],
      "discriminator": [
        183,
        18,
        70,
        156,
        148,
        109,
        161,
        34
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "userPosition",
          "writable": true
        },
        {
          "name": "vaultStore"
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "vaultTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawSol",
      "docs": [
        "Withdraw native SOL from a vault"
      ],
      "discriminator": [
        145,
        131,
        74,
        136,
        65,
        137,
        42,
        38
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "userPosition",
          "writable": true
        },
        {
          "name": "vaultStore"
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "userPosition",
      "discriminator": [
        251,
        248,
        209,
        245,
        83,
        234,
        17,
        27
      ]
    },
    {
      "name": "vault",
      "discriminator": [
        211,
        8,
        232,
        43,
        2,
        152,
        117,
        119
      ]
    },
    {
      "name": "vaultStore",
      "discriminator": [
        117,
        218,
        135,
        77,
        218,
        25,
        32,
        146
      ]
    },
    {
      "name": "yieldTracker",
      "discriminator": [
        113,
        168,
        153,
        236,
        182,
        127,
        57,
        39
      ]
    }
  ],
  "events": [
    {
      "name": "depositMade",
      "discriminator": [
        210,
        201,
        130,
        183,
        244,
        203,
        155,
        199
      ]
    },
    {
      "name": "emergencyPauseActivated",
      "discriminator": [
        27,
        50,
        161,
        55,
        240,
        51,
        173,
        218
      ]
    },
    {
      "name": "manualRebalance",
      "discriminator": [
        77,
        139,
        149,
        225,
        187,
        43,
        55,
        176
      ]
    },
    {
      "name": "rebalanceExecuted",
      "discriminator": [
        194,
        41,
        129,
        249,
        215,
        226,
        122,
        248
      ]
    },
    {
      "name": "rebalanceTriggered",
      "discriminator": [
        17,
        123,
        20,
        170,
        142,
        49,
        80,
        166
      ]
    },
    {
      "name": "systemEmergencyPause",
      "discriminator": [
        212,
        4,
        176,
        124,
        236,
        18,
        65,
        73
      ]
    },
    {
      "name": "systemResumed",
      "discriminator": [
        153,
        164,
        62,
        115,
        188,
        22,
        179,
        80
      ]
    },
    {
      "name": "vaultConfigUpdated",
      "discriminator": [
        72,
        22,
        37,
        111,
        58,
        30,
        160,
        212
      ]
    },
    {
      "name": "vaultCreated",
      "discriminator": [
        117,
        25,
        120,
        254,
        75,
        236,
        78,
        115
      ]
    },
    {
      "name": "withdrawalMade",
      "discriminator": [
        253,
        86,
        154,
        221,
        191,
        29,
        247,
        193
      ]
    },
    {
      "name": "yieldDataReceived",
      "discriminator": [
        100,
        32,
        99,
        40,
        85,
        116,
        4,
        17
      ]
    },
    {
      "name": "yieldQuerySent",
      "discriminator": [
        95,
        120,
        157,
        145,
        16,
        126,
        139,
        96
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidAmount",
      "msg": "Invalid amount provided"
    },
    {
      "code": 6001,
      "name": "depositTooSmall",
      "msg": "Deposit amount is too small"
    },
    {
      "code": 6002,
      "name": "vaultInactive",
      "msg": "Vault is not active"
    },
    {
      "code": 6003,
      "name": "insufficientBalance",
      "msg": "Insufficient balance"
    },
    {
      "code": 6004,
      "name": "invalidLayerZeroEndpoint",
      "msg": "Invalid LayerZero endpoint"
    },
    {
      "code": 6005,
      "name": "invalidPayload",
      "msg": "Invalid payload"
    },
    {
      "code": 6006,
      "name": "invalidVaultId",
      "msg": "Invalid vault ID"
    },
    {
      "code": 6007,
      "name": "rebalanceTooFrequent",
      "msg": "Rebalance too frequent"
    },
    {
      "code": 6008,
      "name": "unauthorizedCaller",
      "msg": "Unauthorized caller"
    },
    {
      "code": 6009,
      "name": "systemPaused",
      "msg": "System paused"
    },
    {
      "code": 6010,
      "name": "invalidChainConfiguration",
      "msg": "Invalid chain configuration"
    },
    {
      "code": 6011,
      "name": "tooManyChains",
      "msg": "Too many chains"
    },
    {
      "code": 6012,
      "name": "invalidThreshold",
      "msg": "Invalid threshold"
    },
    {
      "code": 6013,
      "name": "invalidNonce",
      "msg": "Invalid nonce"
    },
    {
      "code": 6014,
      "name": "unsupportedAction",
      "msg": "Unsupported action"
    },
    {
      "code": 6015,
      "name": "invalidTargetChain",
      "msg": "Invalid target chain"
    },
    {
      "code": 6016,
      "name": "queryTooFrequent",
      "msg": "Query too frequent"
    },
    {
      "code": 6017,
      "name": "vaultEmergencyExit",
      "msg": "Vault emergency exit"
    }
  ],
  "types": [
    {
      "name": "chainYield",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "chainId",
            "type": "u16"
          },
          {
            "name": "apy",
            "type": "u64"
          },
          {
            "name": "tvl",
            "type": "u64"
          },
          {
            "name": "riskScore",
            "type": "u64"
          },
          {
            "name": "lastUpdated",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "depositMade",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vaultId",
            "type": "u64"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "newTotal",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "emergencyPauseActivated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vaultId",
            "type": "u64"
          },
          {
            "name": "triggeredByChain",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "manualRebalance",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vaultId",
            "type": "u64"
          },
          {
            "name": "targetChain",
            "type": "u16"
          },
          {
            "name": "executor",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "rebalanceExecuted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vaultId",
            "type": "u64"
          },
          {
            "name": "allocationData",
            "type": "bytes"
          }
        ]
      }
    },
    {
      "name": "rebalanceTriggered",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vaultId",
            "type": "u64"
          },
          {
            "name": "fromChain",
            "type": "u16"
          },
          {
            "name": "toChain",
            "type": "u16"
          },
          {
            "name": "yieldImprovement",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "riskProfile",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "conservative"
          },
          {
            "name": "moderate"
          },
          {
            "name": "aggressive"
          }
        ]
      }
    },
    {
      "name": "systemEmergencyPause",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "triggeredBy",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "systemResumed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "resumedBy",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "userPosition",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "lastDeposit",
            "type": "i64"
          },
          {
            "name": "lastWithdrawal",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "vault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "riskProfile",
            "type": {
              "defined": {
                "name": "riskProfile"
              }
            }
          },
          {
            "name": "totalDeposits",
            "type": "u64"
          },
          {
            "name": "totalYield",
            "type": "u64"
          },
          {
            "name": "minDeposit",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "lastRebalance",
            "type": "i64"
          },
          {
            "name": "targetChains",
            "type": {
              "vec": "u16"
            }
          },
          {
            "name": "currentBestChain",
            "type": "u16"
          },
          {
            "name": "currentApy",
            "type": "u64"
          },
          {
            "name": "rebalanceThreshold",
            "type": "u64"
          },
          {
            "name": "emergencyExit",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "vaultConfigUpdated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vaultId",
            "type": "u64"
          },
          {
            "name": "updatedBy",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "vaultCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vaultId",
            "type": "u64"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "riskProfile",
            "type": {
              "defined": {
                "name": "riskProfile"
              }
            }
          },
          {
            "name": "targetChains",
            "type": {
              "vec": "u16"
            }
          }
        ]
      }
    },
    {
      "name": "vaultStore",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "totalVaults",
            "type": "u64"
          },
          {
            "name": "totalTvl",
            "type": "u64"
          },
          {
            "name": "feeRate",
            "type": "u16"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "lastGlobalRebalance",
            "type": "i64"
          },
          {
            "name": "emergencyPause",
            "type": "bool"
          },
          {
            "name": "supportedChains",
            "type": {
              "vec": "u16"
            }
          }
        ]
      }
    },
    {
      "name": "withdrawalMade",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vaultId",
            "type": "u64"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "fee",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "yieldDataReceived",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vaultId",
            "type": "u64"
          },
          {
            "name": "chainId",
            "type": "u16"
          },
          {
            "name": "apy",
            "type": "u64"
          },
          {
            "name": "tvl",
            "type": "u64"
          },
          {
            "name": "riskScore",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "yieldQuerySent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vaultId",
            "type": "u64"
          },
          {
            "name": "chains",
            "type": {
              "vec": "u16"
            }
          },
          {
            "name": "nonce",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "yieldTracker",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "chainYields",
            "type": {
              "vec": {
                "defined": {
                  "name": "chainYield"
                }
              }
            }
          },
          {
            "name": "lastUpdate",
            "type": "i64"
          },
          {
            "name": "queryNonce",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
