// This file is auto-generated from the IDL
// Do not edit manually

export type OmnivaultIDL = {
  "version": "0.1.0",
  "name": "omnivault",
  "address": "HAGPttZ592S5xv5TPrkVLPQpkNGrNPAw42kGjdR9vUc4",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "vaultStore",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "createVault",
      "accounts": [
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultStore",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "riskProfile",
          "type": {
            "defined": "RiskProfile"
          }
        },
        {
          "name": "minDeposit",
          "type": "u64"
        }
      ]
    },
    {
      "name": "deposit",
      "accounts": [
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userPosition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
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
      "name": "withdraw",
      "accounts": [
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userPosition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
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
      "name": "lzSend",
      "accounts": [
        {
          "name": "vault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "endpoint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "oappConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "dstChainId",
          "type": "u16"
        },
        {
          "name": "message",
          "type": "bytes"
        },
        {
          "name": "options",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "lzReceive",
      "accounts": [
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "endpoint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "oappConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
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
      "accounts": [
        {
          "name": "vault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "endpoint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "oappConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": false,
          "isSigner": true
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
      "name": "rebalanceVault",
      "accounts": [
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": []
    },
    {
      "name": "updateVaultConfig",
      "accounts": [
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
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
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "VaultStore",
      "discriminator": [
        123,
        45,
        67,
        89,
        123,
        45,
        67,
        89
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
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
          }
        ]
      }
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
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "riskProfile",
            "type": {
              "defined": "RiskProfile"
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
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "UserPosition",
      "discriminator": [
        170,
        188,
        143,
        228,
        122,
        64,
        247,
        208
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "publicKey"
          },
          {
            "name": "user",
            "type": "publicKey"
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
    }
  ],
  "types": [
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
      "name": "LzSendData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "dstChainId",
            "type": "u16"
          },
          {
            "name": "message",
            "type": "bytes"
          },
          {
            "name": "options",
            "type": "bytes"
          }
        ]
      }
    },
    {
      "name": "CrossChainMessage",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "action",
            "type": {
              "defined": "CrossChainAction"
            }
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "nonce",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "CrossChainAction",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Rebalance",
            "fields": [
              {
                "name": "vaultId",
                "type": "u64"
              },
              {
                "name": "newAllocation",
                "type": "bytes"
              }
            ]
          },
          {
            "name": "YieldUpdate",
            "fields": [
              {
                "name": "vaultId",
                "type": "u64"
              },
              {
                "name": "yieldAmount",
                "type": "u64"
              }
            ]
          },
          {
            "name": "EmergencyPause",
            "fields": [
              {
                "name": "vaultId",
                "type": "u64"
              }
            ]
          }
        ]
      }
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
    }
  ]
};

export const IDL: OmnivaultIDL = {
  "version": "0.1.0",
  "name": "omnivault",
  "address": "HAGPttZ592S5xv5TPrkVLPQpkNGrNPAw42kGjdR9vUc4",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "vaultStore",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "createVault",
      "accounts": [
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultStore",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "riskProfile",
          "type": {
            "defined": "RiskProfile"
          }
        },
        {
          "name": "minDeposit",
          "type": "u64"
        }
      ]
    },
    {
      "name": "deposit",
      "accounts": [
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userPosition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
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
      "name": "withdraw",
      "accounts": [
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userPosition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
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
      "name": "lzSend",
      "accounts": [
        {
          "name": "vault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "endpoint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "oappConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "dstChainId",
          "type": "u16"
        },
        {
          "name": "message",
          "type": "bytes"
        },
        {
          "name": "options",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "lzReceive",
      "accounts": [
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "endpoint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "oappConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
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
      "accounts": [
        {
          "name": "vault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "endpoint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "oappConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": false,
          "isSigner": true
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
      "name": "rebalanceVault",
      "accounts": [
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": []
    },
    {
      "name": "updateVaultConfig",
      "accounts": [
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
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
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "VaultStore",
      "discriminator": [
        123,
        45,
        67,
        89,
        123,
        45,
        67,
        89
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
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
          }
        ]
      }
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
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "riskProfile",
            "type": {
              "defined": "RiskProfile"
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
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "UserPosition",
      "discriminator": [
        170,
        188,
        143,
        228,
        122,
        64,
        247,
        208
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "publicKey"
          },
          {
            "name": "user",
            "type": "publicKey"
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
    }
  ],
  "types": [
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
      "name": "LzSendData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "dstChainId",
            "type": "u16"
          },
          {
            "name": "message",
            "type": "bytes"
          },
          {
            "name": "options",
            "type": "bytes"
          }
        ]
      }
    },
    {
      "name": "CrossChainMessage",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "action",
            "type": {
              "defined": "CrossChainAction"
            }
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "nonce",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "CrossChainAction",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Rebalance",
            "fields": [
              {
                "name": "vaultId",
                "type": "u64"
              },
              {
                "name": "newAllocation",
                "type": "bytes"
              }
            ]
          },
          {
            "name": "YieldUpdate",
            "fields": [
              {
                "name": "vaultId",
                "type": "u64"
              },
              {
                "name": "yieldAmount",
                "type": "u64"
              }
            ]
          },
          {
            "name": "EmergencyPause",
            "fields": [
              {
                "name": "vaultId",
                "type": "u64"
              }
            ]
          }
        ]
      }
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
    }
  ]
};
