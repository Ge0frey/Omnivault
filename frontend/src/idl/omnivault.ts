// This file is auto-generated from the IDL
// Do not edit manually

export type OmnivaultIDL = {
  "address": "66bzWSC6dWFKdAZDcdj7wbjHZ6YWBHB4o77tbP3twVnd",
  "metadata": {
    "name": "omnivault",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "OmniVault: Cross-Chain Yield Optimizer"
  },
  "instructions": [
    {
      "name": "create_vault",
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
                "account": "VaultStore"
              }
            ]
          }
        },
        {
          "name": "yield_tracker",
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
          "name": "vault_store",
          "writable": true
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "risk_profile",
          "type": {
            "defined": {
              "name": "RiskProfile"
            }
          }
        },
        {
          "name": "min_deposit",
          "type": "u64"
        },
        {
          "name": "target_chains",
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
          "name": "user_position",
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
          "name": "vault_store"
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "user_token_account",
          "writable": true
        },
        {
          "name": "vault_token_account",
          "writable": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "system_program",
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
      "name": "emergency_pause",
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
          "name": "vault_store",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "vault_store"
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
          "name": "vault_store",
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
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "lz_receive",
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
          "name": "yield_tracker",
          "writable": true
        },
        {
          "name": "endpoint"
        },
        {
          "name": "oapp_config"
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "src_chain_id",
          "type": "u16"
        },
        {
          "name": "payload",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "lz_receive_types",
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
          "name": "yield_tracker"
        },
        {
          "name": "endpoint"
        },
        {
          "name": "oapp_config"
        },
        {
          "name": "payer",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "src_chain_id",
          "type": "u16"
        }
      ]
    },
    {
      "name": "query_cross_chain_yields",
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
          "name": "yield_tracker",
          "writable": true
        },
        {
          "name": "endpoint"
        },
        {
          "name": "oapp_config"
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "target_chains",
          "type": {
            "vec": "u16"
          }
        }
      ]
    },
    {
      "name": "rebalance_vault",
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
          "name": "vault_store"
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "target_chain",
          "type": "u16"
        }
      ]
    },
    {
      "name": "resume_operations",
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
          "name": "vault_store",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "vault_store"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "update_vault_config",
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
          "name": "new_min_deposit",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "new_active_status",
          "type": {
            "option": "bool"
          }
        },
        {
          "name": "new_rebalance_threshold",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "new_target_chains",
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
          "name": "user_position",
          "writable": true
        },
        {
          "name": "vault_store"
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "user_token_account",
          "writable": true
        },
        {
          "name": "vault_token_account",
          "writable": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
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
      "name": "UserPosition",
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
      "name": "Vault",
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
      "name": "VaultStore",
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
      "name": "YieldTracker",
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
      "name": "DepositMade",
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
      "name": "EmergencyPauseActivated",
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
      "name": "ManualRebalance",
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
      "name": "RebalanceExecuted",
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
      "name": "RebalanceTriggered",
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
      "name": "SystemEmergencyPause",
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
      "name": "SystemResumed",
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
      "name": "VaultConfigUpdated",
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
      "name": "VaultCreated",
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
      "name": "WithdrawalMade",
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
      "name": "YieldDataReceived",
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
      "name": "YieldQuerySent",
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
      "name": "InvalidAmount",
      "msg": "Invalid amount provided"
    },
    {
      "code": 6001,
      "name": "DepositTooSmall",
      "msg": "Deposit amount is too small"
    },
    {
      "code": 6002,
      "name": "VaultInactive",
      "msg": "Vault is not active"
    },
    {
      "code": 6003,
      "name": "InsufficientBalance",
      "msg": "Insufficient balance"
    },
    {
      "code": 6004,
      "name": "InvalidLayerZeroEndpoint",
      "msg": "Invalid LayerZero endpoint"
    },
    {
      "code": 6005,
      "name": "InvalidPayload",
      "msg": "Invalid payload"
    },
    {
      "code": 6006,
      "name": "InvalidVaultId",
      "msg": "Invalid vault ID"
    },
    {
      "code": 6007,
      "name": "RebalanceTooFrequent",
      "msg": "Rebalance too frequent"
    },
    {
      "code": 6008,
      "name": "UnauthorizedCaller",
      "msg": "Unauthorized caller"
    },
    {
      "code": 6009,
      "name": "SystemPaused",
      "msg": "System paused"
    },
    {
      "code": 6010,
      "name": "InvalidChainConfiguration",
      "msg": "Invalid chain configuration"
    },
    {
      "code": 6011,
      "name": "TooManyChains",
      "msg": "Too many chains"
    },
    {
      "code": 6012,
      "name": "InvalidThreshold",
      "msg": "Invalid threshold"
    },
    {
      "code": 6013,
      "name": "InvalidNonce",
      "msg": "Invalid nonce"
    },
    {
      "code": 6014,
      "name": "UnsupportedAction",
      "msg": "Unsupported action"
    },
    {
      "code": 6015,
      "name": "InvalidTargetChain",
      "msg": "Invalid target chain"
    },
    {
      "code": 6016,
      "name": "QueryTooFrequent",
      "msg": "Query too frequent"
    },
    {
      "code": 6017,
      "name": "VaultEmergencyExit",
      "msg": "Vault emergency exit"
    }
  ],
  "types": [
    {
      "name": "ChainYield",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "chain_id",
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
            "name": "risk_score",
            "type": "u64"
          },
          {
            "name": "last_updated",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "DepositMade",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault_id",
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
            "name": "new_total",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "EmergencyPauseActivated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault_id",
            "type": "u64"
          },
          {
            "name": "triggered_by_chain",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "ManualRebalance",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault_id",
            "type": "u64"
          },
          {
            "name": "target_chain",
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
      "name": "RebalanceExecuted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault_id",
            "type": "u64"
          },
          {
            "name": "allocation_data",
            "type": "bytes"
          }
        ]
      }
    },
    {
      "name": "RebalanceTriggered",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault_id",
            "type": "u64"
          },
          {
            "name": "from_chain",
            "type": "u16"
          },
          {
            "name": "to_chain",
            "type": "u16"
          },
          {
            "name": "yield_improvement",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "RiskProfile",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Conservative"
          },
          {
            "name": "Moderate"
          },
          {
            "name": "Aggressive"
          }
        ]
      }
    },
    {
      "name": "SystemEmergencyPause",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "triggered_by",
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
      "name": "SystemResumed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "resumed_by",
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
      "name": "UserPosition",
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
            "name": "last_deposit",
            "type": "i64"
          },
          {
            "name": "last_withdrawal",
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
      "name": "Vault",
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
            "name": "risk_profile",
            "type": {
              "defined": {
                "name": "RiskProfile"
              }
            }
          },
          {
            "name": "total_deposits",
            "type": "u64"
          },
          {
            "name": "total_yield",
            "type": "u64"
          },
          {
            "name": "min_deposit",
            "type": "u64"
          },
          {
            "name": "is_active",
            "type": "bool"
          },
          {
            "name": "last_rebalance",
            "type": "i64"
          },
          {
            "name": "target_chains",
            "type": {
              "vec": "u16"
            }
          },
          {
            "name": "current_best_chain",
            "type": "u16"
          },
          {
            "name": "current_apy",
            "type": "u64"
          },
          {
            "name": "rebalance_threshold",
            "type": "u64"
          },
          {
            "name": "emergency_exit",
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
      "name": "VaultConfigUpdated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault_id",
            "type": "u64"
          },
          {
            "name": "updated_by",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "VaultCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault_id",
            "type": "u64"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "risk_profile",
            "type": {
              "defined": {
                "name": "RiskProfile"
              }
            }
          },
          {
            "name": "target_chains",
            "type": {
              "vec": "u16"
            }
          }
        ]
      }
    },
    {
      "name": "VaultStore",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "total_vaults",
            "type": "u64"
          },
          {
            "name": "total_tvl",
            "type": "u64"
          },
          {
            "name": "fee_rate",
            "type": "u16"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "last_global_rebalance",
            "type": "i64"
          },
          {
            "name": "emergency_pause",
            "type": "bool"
          },
          {
            "name": "supported_chains",
            "type": {
              "vec": "u16"
            }
          }
        ]
      }
    },
    {
      "name": "WithdrawalMade",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault_id",
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
      "name": "YieldDataReceived",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault_id",
            "type": "u64"
          },
          {
            "name": "chain_id",
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
            "name": "risk_score",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "YieldQuerySent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault_id",
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
      "name": "YieldTracker",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "chain_yields",
            "type": {
              "vec": {
                "defined": {
                  "name": "ChainYield"
                }
              }
            }
          },
          {
            "name": "last_update",
            "type": "i64"
          },
          {
            "name": "query_nonce",
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

export const OmnivaultIDL: OmnivaultIDL = {
  "address": "66bzWSC6dWFKdAZDcdj7wbjHZ6YWBHB4o77tbP3twVnd",
  "metadata": {
    "name": "omnivault",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "OmniVault: Cross-Chain Yield Optimizer"
  },
  "instructions": [
    {
      "name": "create_vault",
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
                "account": "VaultStore"
              }
            ]
          }
        },
        {
          "name": "yield_tracker",
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
          "name": "vault_store",
          "writable": true
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "risk_profile",
          "type": {
            "defined": {
              "name": "RiskProfile"
            }
          }
        },
        {
          "name": "min_deposit",
          "type": "u64"
        },
        {
          "name": "target_chains",
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
          "name": "user_position",
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
          "name": "vault_store"
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "user_token_account",
          "writable": true
        },
        {
          "name": "vault_token_account",
          "writable": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "system_program",
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
      "name": "emergency_pause",
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
          "name": "vault_store",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "vault_store"
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
          "name": "vault_store",
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
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "lz_receive",
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
          "name": "yield_tracker",
          "writable": true
        },
        {
          "name": "endpoint"
        },
        {
          "name": "oapp_config"
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "src_chain_id",
          "type": "u16"
        },
        {
          "name": "payload",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "lz_receive_types",
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
          "name": "yield_tracker"
        },
        {
          "name": "endpoint"
        },
        {
          "name": "oapp_config"
        },
        {
          "name": "payer",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "src_chain_id",
          "type": "u16"
        }
      ]
    },
    {
      "name": "query_cross_chain_yields",
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
          "name": "yield_tracker",
          "writable": true
        },
        {
          "name": "endpoint"
        },
        {
          "name": "oapp_config"
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "target_chains",
          "type": {
            "vec": "u16"
          }
        }
      ]
    },
    {
      "name": "rebalance_vault",
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
          "name": "vault_store"
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "target_chain",
          "type": "u16"
        }
      ]
    },
    {
      "name": "resume_operations",
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
          "name": "vault_store",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "vault_store"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "update_vault_config",
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
          "name": "new_min_deposit",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "new_active_status",
          "type": {
            "option": "bool"
          }
        },
        {
          "name": "new_rebalance_threshold",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "new_target_chains",
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
          "name": "user_position",
          "writable": true
        },
        {
          "name": "vault_store"
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "user_token_account",
          "writable": true
        },
        {
          "name": "vault_token_account",
          "writable": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
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
      "name": "UserPosition",
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
      "name": "Vault",
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
      "name": "VaultStore",
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
      "name": "YieldTracker",
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
      "name": "DepositMade",
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
      "name": "EmergencyPauseActivated",
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
      "name": "ManualRebalance",
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
      "name": "RebalanceExecuted",
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
      "name": "RebalanceTriggered",
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
      "name": "SystemEmergencyPause",
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
      "name": "SystemResumed",
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
      "name": "VaultConfigUpdated",
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
      "name": "VaultCreated",
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
      "name": "WithdrawalMade",
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
      "name": "YieldDataReceived",
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
      "name": "YieldQuerySent",
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
      "name": "InvalidAmount",
      "msg": "Invalid amount provided"
    },
    {
      "code": 6001,
      "name": "DepositTooSmall",
      "msg": "Deposit amount is too small"
    },
    {
      "code": 6002,
      "name": "VaultInactive",
      "msg": "Vault is not active"
    },
    {
      "code": 6003,
      "name": "InsufficientBalance",
      "msg": "Insufficient balance"
    },
    {
      "code": 6004,
      "name": "InvalidLayerZeroEndpoint",
      "msg": "Invalid LayerZero endpoint"
    },
    {
      "code": 6005,
      "name": "InvalidPayload",
      "msg": "Invalid payload"
    },
    {
      "code": 6006,
      "name": "InvalidVaultId",
      "msg": "Invalid vault ID"
    },
    {
      "code": 6007,
      "name": "RebalanceTooFrequent",
      "msg": "Rebalance too frequent"
    },
    {
      "code": 6008,
      "name": "UnauthorizedCaller",
      "msg": "Unauthorized caller"
    },
    {
      "code": 6009,
      "name": "SystemPaused",
      "msg": "System paused"
    },
    {
      "code": 6010,
      "name": "InvalidChainConfiguration",
      "msg": "Invalid chain configuration"
    },
    {
      "code": 6011,
      "name": "TooManyChains",
      "msg": "Too many chains"
    },
    {
      "code": 6012,
      "name": "InvalidThreshold",
      "msg": "Invalid threshold"
    },
    {
      "code": 6013,
      "name": "InvalidNonce",
      "msg": "Invalid nonce"
    },
    {
      "code": 6014,
      "name": "UnsupportedAction",
      "msg": "Unsupported action"
    },
    {
      "code": 6015,
      "name": "InvalidTargetChain",
      "msg": "Invalid target chain"
    },
    {
      "code": 6016,
      "name": "QueryTooFrequent",
      "msg": "Query too frequent"
    },
    {
      "code": 6017,
      "name": "VaultEmergencyExit",
      "msg": "Vault emergency exit"
    }
  ],
  "types": [
    {
      "name": "ChainYield",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "chain_id",
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
            "name": "risk_score",
            "type": "u64"
          },
          {
            "name": "last_updated",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "DepositMade",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault_id",
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
            "name": "new_total",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "EmergencyPauseActivated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault_id",
            "type": "u64"
          },
          {
            "name": "triggered_by_chain",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "ManualRebalance",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault_id",
            "type": "u64"
          },
          {
            "name": "target_chain",
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
      "name": "RebalanceExecuted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault_id",
            "type": "u64"
          },
          {
            "name": "allocation_data",
            "type": "bytes"
          }
        ]
      }
    },
    {
      "name": "RebalanceTriggered",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault_id",
            "type": "u64"
          },
          {
            "name": "from_chain",
            "type": "u16"
          },
          {
            "name": "to_chain",
            "type": "u16"
          },
          {
            "name": "yield_improvement",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "RiskProfile",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Conservative"
          },
          {
            "name": "Moderate"
          },
          {
            "name": "Aggressive"
          }
        ]
      }
    },
    {
      "name": "SystemEmergencyPause",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "triggered_by",
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
      "name": "SystemResumed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "resumed_by",
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
      "name": "UserPosition",
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
            "name": "last_deposit",
            "type": "i64"
          },
          {
            "name": "last_withdrawal",
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
      "name": "Vault",
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
            "name": "risk_profile",
            "type": {
              "defined": {
                "name": "RiskProfile"
              }
            }
          },
          {
            "name": "total_deposits",
            "type": "u64"
          },
          {
            "name": "total_yield",
            "type": "u64"
          },
          {
            "name": "min_deposit",
            "type": "u64"
          },
          {
            "name": "is_active",
            "type": "bool"
          },
          {
            "name": "last_rebalance",
            "type": "i64"
          },
          {
            "name": "target_chains",
            "type": {
              "vec": "u16"
            }
          },
          {
            "name": "current_best_chain",
            "type": "u16"
          },
          {
            "name": "current_apy",
            "type": "u64"
          },
          {
            "name": "rebalance_threshold",
            "type": "u64"
          },
          {
            "name": "emergency_exit",
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
      "name": "VaultConfigUpdated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault_id",
            "type": "u64"
          },
          {
            "name": "updated_by",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "VaultCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault_id",
            "type": "u64"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "risk_profile",
            "type": {
              "defined": {
                "name": "RiskProfile"
              }
            }
          },
          {
            "name": "target_chains",
            "type": {
              "vec": "u16"
            }
          }
        ]
      }
    },
    {
      "name": "VaultStore",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "total_vaults",
            "type": "u64"
          },
          {
            "name": "total_tvl",
            "type": "u64"
          },
          {
            "name": "fee_rate",
            "type": "u16"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "last_global_rebalance",
            "type": "i64"
          },
          {
            "name": "emergency_pause",
            "type": "bool"
          },
          {
            "name": "supported_chains",
            "type": {
              "vec": "u16"
            }
          }
        ]
      }
    },
    {
      "name": "WithdrawalMade",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault_id",
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
      "name": "YieldDataReceived",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault_id",
            "type": "u64"
          },
          {
            "name": "chain_id",
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
            "name": "risk_score",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "YieldQuerySent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault_id",
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
      "name": "YieldTracker",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "chain_yields",
            "type": {
              "vec": {
                "defined": {
                  "name": "ChainYield"
                }
              }
            }
          },
          {
            "name": "last_update",
            "type": "i64"
          },
          {
            "name": "query_nonce",
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

export const IDL: OmnivaultIDL = OmnivaultIDL;
