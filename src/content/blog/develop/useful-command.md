---
title: "かゆいところに手が届くUNIXコマンド"
date: "2026-06-29T12:42:06+09:00"
draft: true
tags: ["開発"]
---

## OSバージョン確認

- mac

```nushell
➜ sw_vers
ProductName:            macOS
ProductVersion:         26.5.1
BuildVersion:           25F80
```

- UNIX

```nushell
lsb_release -a
```

## メモリ, GPU, CPU確認

- mac

```nushell
➜   system_profiler SPHardwareDataType SPDisplaysDataType SPMemoryDataType

2026-06-29 13:42:11.435 system_profiler[11138:5591570] hw.cpufamily: 0x1b588bb3
Hardware:

    Hardware Overview:

      Model Name: MacBook Air
      Model Identifier: MacBookAir10,1
      Model Number: MGQN3J/A
      Chip: Apple M1
      Total Number of Cores: 8 (4 Performance and 4 Efficiency)
      Memory: 16 GB
      System Firmware Version: 18000.120.36
      OS Loader Version: 18000.120.36
      Serial Number (system): FVFF30RZQ72X
      Hardware UUID: F7553EF7-5C1B-5DB7-BFD6-94D069A05E47
      Provisioning UDID: 00008103-000169A002E2001E
      Activation Lock Status: Enabled

Graphics/Displays:

    Apple M1:

      Chipset Model: Apple M1
      Type: GPU
      Bus: Built-In
      Total Number of Cores: 8
      Vendor: Apple (0x106b)
      Metal Support: Metal 4
      Displays:
        Color LCD:
          Display Type: Built-In Retina LCD
          Resolution: 2560 x 1600 Retina
          Main Display: Yes
          Mirror: Off
          Online: Yes
          Automatically Adjust Brightness: No
          Connection Type: Internal

Memory:

      Memory: 16 GB
      Type: LPDDR4
      Manufacturer: Hynix
```

- UNIX

```nushell
# CPU
lscpu

# GPU
sudo lshw -C display

# Nvidia製なら↓が使えるはず…
# nvidia-smi

```
