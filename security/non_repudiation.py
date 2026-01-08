"""
Non-Repudiation Chain (不可否認簽名鏈)
使用簽名鏈保證 STC 的不可否認性
"""

import hashlib
import json
import secrets
from datetime import datetime
from typing import Dict, List, Any

class NonRepudiationChain:
    """
    不可否認簽名鏈 (A14 執行)
    """
    
    def __init__(self, db):
        self.db = db
        self.node_keys = {}  # node_id -> {"public": ..., "private": ...}
    
    def generate_keypair(self, node_id: str) -> Dict[str, str]:
        """
        為節點生成密鑰對
        """
        # 簡化版：實際應使用 Ed25519
        private_key = secrets.token_hex(32)
        public_key = hashlib.sha256(private_key.encode()).hexdigest()
        
        self.node_keys[node_id] = {
            "public": public_key,
            "private": private_key
        }
        
        return {"node_id": node_id, "public_key": public_key}
    
    def sign_stc(self, node_id: str, stc: Dict[str, Any]) -> Dict[str, Any]:
        """
        簽名 STC
        """
        if node_id not in self.node_keys:
            self.generate_keypair(node_id)
        
        # 計算 STC 哈希
        stc_content = json.dumps(stc, sort_keys=True, default=str)
        stc_hash = hashlib.sha256(stc_content.encode()).hexdigest()
        
        # 簡化版簽名
        private_key = self.node_keys[node_id]["private"]
        signature = hashlib.sha256(f"{stc_hash}{private_key}".encode()).hexdigest()
        
        return {
            "stc_hash": stc_hash,
            "signature": signature,
            "signer": node_id,
            "public_key": self.node_keys[node_id]["public"],
            "timestamp": datetime.now().isoformat()
        }
    
    def verify_signature(self, stc: Dict[str, Any], signature_data: Dict[str, Any]) -> bool:
        """
        驗證簽名
        """
        node_id = signature_data["signer"]
        if node_id not in self.node_keys:
            return False
        
        # 重新計算 STC 哈希
        stc_content = json.dumps(stc, sort_keys=True, default=str)
        stc_hash = hashlib.sha256(stc_content.encode()).hexdigest()
        
        # 驗證簽名
        private_key = self.node_keys[node_id]["private"]
        expected_signature = hashlib.sha256(f"{stc_hash}{private_key}".encode()).hexdigest()
        
        return signature_data["signature"] == expected_signature
    
    def create_proof_chain(self, stc: Dict[str, Any], signers: List[str]) -> Dict[str, Any]:
        """
        創建多簽名證明鏈
        """
        signatures = []
        for signer in signers:
            sig = self.sign_stc(signer, stc)
            signatures.append(sig)
        
        return {
            "stc_id": stc.get("id"),
            "proof_chain": signatures,
            "chain_length": len(signatures),
            "created_at": datetime.now().isoformat()
        }
