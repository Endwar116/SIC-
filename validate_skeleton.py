#!/usr/bin/env python3
"""
Semantic Skeleton Schema Validator
語義骨架 Schema 驗證器

功能：
1. 驗證骨架 JSON 是否符合 Schema 規範
2. 檢查結構完整性
3. 驗證鉤子一致性
4. 計算張力場統計

使用方式：
    python validate_skeleton.py <skeleton.json>
    python validate_skeleton.py --all  # 驗證 examples 目錄下所有文件
"""

import json
import sys
import os
from datetime import datetime
from typing import Dict, List, Any, Tuple, Optional
import re

# 嘗試導入 jsonschema，如果沒有則提供降級驗證
try:
    import jsonschema
    from jsonschema import validate, ValidationError, Draft7Validator
    HAS_JSONSCHEMA = True
except ImportError:
    HAS_JSONSCHEMA = False
    print("警告: jsonschema 未安裝，將使用基本驗證模式")
    print("安裝: pip install jsonschema --break-system-packages")


class SkeletonValidator:
    """語義骨架驗證器"""
    
    def __init__(self, schema_path: str = None):
        self.schema = None
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.stats: Dict[str, Any] = {}
        
        if schema_path and os.path.exists(schema_path):
            with open(schema_path, 'r', encoding='utf-8') as f:
                self.schema = json.load(f)
    
    def validate(self, skeleton: Dict) -> Tuple[bool, List[str], List[str]]:
        """
        執行完整驗證
        
        返回: (是否通過, 錯誤列表, 警告列表)
        """
        self.errors = []
        self.warnings = []
        self.stats = {}
        
        # 1. Schema 驗證
        if HAS_JSONSCHEMA and self.schema:
            self._validate_schema(skeleton)
        
        # 2. 結構完整性驗證
        self._validate_structure(skeleton)
        
        # 3. 鉤子一致性驗證
        self._validate_hooks(skeleton)
        
        # 4. 張力場驗證
        self._validate_tension_field(skeleton)
        
        # 5. 版本一致性驗證
        self._validate_versioning(skeleton)
        
        # 6. 計算統計
        self._calculate_stats(skeleton)
        
        return len(self.errors) == 0, self.errors, self.warnings
    
    def _validate_schema(self, skeleton: Dict):
        """JSON Schema 驗證"""
        try:
            validate(instance=skeleton, schema=self.schema)
        except ValidationError as e:
            self.errors.append(f"Schema 驗證失敗: {e.message}")
            self.errors.append(f"  路徑: {' -> '.join(str(p) for p in e.absolute_path)}")
    
    def _validate_structure(self, skeleton: Dict):
        """結構完整性驗證"""
        
        # 檢查必填字段
        required_fields = ['schema_version', 'skeleton_version', 'created_at', 
                          'updated_at', 'divisions', 'tension_field', 'metadata']
        for field in required_fields:
            if field not in skeleton:
                self.errors.append(f"缺少必填字段: {field}")
        
        # 檢查 divisions 結構
        if 'divisions' in skeleton:
            segment_ids = set()
            for div_idx, division in enumerate(skeleton['divisions']):
                if 'id' not in division:
                    self.errors.append(f"Division [{div_idx}] 缺少 id")
                if 'segments' not in division:
                    self.errors.append(f"Division [{div_idx}] 缺少 segments")
                    continue
                
                for seg_idx, segment in enumerate(division.get('segments', [])):
                    # 檢查 segment ID 唯一性
                    seg_id = segment.get('id')
                    if seg_id in segment_ids:
                        self.errors.append(f"Segment ID {seg_id} 重複")
                    if seg_id:
                        segment_ids.add(seg_id)
                    
                    # 檢查 blocks
                    if 'blocks' in segment:
                        block_types = [b.get('type') for b in segment['blocks']]
                        # 檢查是否有重複的 block type（custom 除外）
                        non_custom = [t for t in block_types if t != 'custom']
                        if len(non_custom) != len(set(non_custom)):
                            self.warnings.append(
                                f"Segment {seg_id} 有重複的 block type"
                            )
    
    def _validate_hooks(self, skeleton: Dict):
        """鉤子一致性驗證"""
        
        all_hooks = []
        hook_ids = set()
        
        # 收集所有鉤子
        for division in skeleton.get('divisions', []):
            for hook in division.get('division_hooks', []):
                all_hooks.append(('division', division.get('id'), hook))
            
            for segment in division.get('segments', []):
                for hook in segment.get('segment_hooks', []):
                    all_hooks.append(('segment', segment.get('id'), hook))
                
                if segment.get('entry_hook'):
                    all_hooks.append(('entry', segment.get('id'), segment['entry_hook']))
                if segment.get('exit_hook'):
                    all_hooks.append(('exit', segment.get('id'), segment['exit_hook']))
        
        for hook in skeleton.get('global_hooks', []):
            all_hooks.append(('global', None, hook))
        
        # 驗證每個鉤子
        for hook_type, parent_id, hook in all_hooks:
            hook_id = hook.get('hook_id')
            
            # 檢查 ID 唯一性
            if hook_id in hook_ids:
                self.warnings.append(f"鉤子 ID {hook_id} 重複使用（可能是跨段引用）")
            hook_ids.add(hook_id)
            
            # 檢查三位一體完整性
            has_semantic = 'semantic' in hook and hook['semantic']
            has_structural = 'structural' in hook and hook['structural']
            has_tonal = 'tonal' in hook and hook['tonal']
            
            if has_structural and not (has_semantic or has_tonal):
                self.warnings.append(
                    f"鉤子 {hook_id} 只有 structural，缺少 semantic 和 tonal"
                )
            
            # 檢查信度
            confidence = hook.get('confidence', 1.0)
            if confidence < 0.5:
                self.warnings.append(
                    f"鉤子 {hook_id} 信度過低 ({confidence})"
                )
    
    def _validate_tension_field(self, skeleton: Dict):
        """張力場驗證"""
        
        tension_field = skeleton.get('tension_field', {})
        sources = tension_field.get('sources', [])
        resultant = tension_field.get('resultant', {})
        
        # 檢查張力源是否引用存在的 segment
        all_segment_ids = set()
        for division in skeleton.get('divisions', []):
            for segment in division.get('segments', []):
                all_segment_ids.add(segment.get('id'))
        
        for source in sources:
            seg_id = source.get('source_segment')
            if seg_id and seg_id not in all_segment_ids:
                self.errors.append(
                    f"張力源引用不存在的 Segment: {seg_id}"
                )
        
        # 檢查合成向量方向是否合理
        primary = resultant.get('primary_direction', '')
        if primary:
            # 提取 segment ID
            match = re.search(r'segment[_\s]*(\d+)', primary, re.IGNORECASE)
            if match:
                ref_id = int(match.group(1))
                if ref_id not in all_segment_ids:
                    self.warnings.append(
                        f"張力場 primary_direction 引用可能無效: {primary}"
                    )
        
        # 檢查張力強度總和
        total_intensity = sum(s.get('intensity', 0) for s in sources if not s.get('resolved'))
        if total_intensity > 3.0:
            self.warnings.append(
                f"未解決張力總強度過高 ({total_intensity:.2f})，可能需要分解任務"
            )
    
    def _validate_versioning(self, skeleton: Dict):
        """版本一致性驗證"""
        
        schema_version = skeleton.get('schema_version', '')
        skeleton_version = skeleton.get('skeleton_version', '')
        parent_version = skeleton.get('parent_version')
        
        # 檢查版本號格式
        version_pattern = r'^\d+\.\d+\.\d+$'
        if not re.match(version_pattern, schema_version):
            self.errors.append(f"schema_version 格式錯誤: {schema_version}")
        if not re.match(version_pattern, skeleton_version):
            self.errors.append(f"skeleton_version 格式錯誤: {skeleton_version}")
        
        # 檢查時間順序
        created = skeleton.get('created_at', '')
        updated = skeleton.get('updated_at', '')
        if created and updated:
            try:
                created_dt = datetime.fromisoformat(created.replace('Z', '+00:00'))
                updated_dt = datetime.fromisoformat(updated.replace('Z', '+00:00'))
                if updated_dt < created_dt:
                    self.errors.append("updated_at 早於 created_at")
            except ValueError as e:
                self.warnings.append(f"時間格式解析警告: {e}")
        
        # 檢查 changelog
        changelog = skeleton.get('changelog', [])
        if changelog:
            versions_in_log = [entry.get('version') for entry in changelog]
            if skeleton_version not in versions_in_log:
                self.warnings.append(
                    f"當前版本 {skeleton_version} 未在 changelog 中記錄"
                )
    
    def _calculate_stats(self, skeleton: Dict):
        """計算統計數據"""
        
        total_divisions = 0
        total_segments = 0
        total_blocks = 0
        total_words = 0
        complete_segments = 0
        in_progress_segments = 0
        pending_segments = 0
        total_hooks = 0
        
        for division in skeleton.get('divisions', []):
            total_divisions += 1
            for segment in division.get('segments', []):
                total_segments += 1
                total_words += segment.get('word_count', 0)
                
                status = segment.get('status', 'pending')
                if status == 'complete':
                    complete_segments += 1
                elif status == 'in_progress':
                    in_progress_segments += 1
                else:
                    pending_segments += 1
                
                total_blocks += len(segment.get('blocks', []))
                total_hooks += len(segment.get('segment_hooks', []))
                if segment.get('entry_hook'):
                    total_hooks += 1
                if segment.get('exit_hook'):
                    total_hooks += 1
            
            total_hooks += len(division.get('division_hooks', []))
        
        total_hooks += len(skeleton.get('global_hooks', []))
        
        # 張力統計
        tension_field = skeleton.get('tension_field', {})
        sources = tension_field.get('sources', [])
        unresolved_tensions = [s for s in sources if not s.get('resolved', False)]
        
        self.stats = {
            'total_divisions': total_divisions,
            'total_segments': total_segments,
            'total_blocks': total_blocks,
            'total_words': total_words,
            'complete_segments': complete_segments,
            'in_progress_segments': in_progress_segments,
            'pending_segments': pending_segments,
            'completion_percentage': round(
                (complete_segments / total_segments * 100) if total_segments > 0 else 0, 2
            ),
            'total_hooks': total_hooks,
            'tension_sources': len(sources),
            'unresolved_tensions': len(unresolved_tensions),
            'resultant_magnitude': tension_field.get('resultant', {}).get('magnitude', 0)
        }
    
    def get_stats(self) -> Dict:
        """獲取統計數據"""
        return self.stats
    
    def print_report(self, skeleton: Dict, filename: str = ""):
        """打印驗證報告"""
        
        passed, errors, warnings = self.validate(skeleton)
        
        print("\n" + "=" * 60)
        print(f"語義骨架驗證報告")
        if filename:
            print(f"文件: {filename}")
        print("=" * 60)
        
        # 基本信息
        print(f"\n📋 基本信息:")
        print(f"   標題: {skeleton.get('title', 'N/A')}")
        print(f"   Schema 版本: {skeleton.get('schema_version', 'N/A')}")
        print(f"   骨架版本: {skeleton.get('skeleton_version', 'N/A')}")
        print(f"   創建時間: {skeleton.get('created_at', 'N/A')}")
        print(f"   更新時間: {skeleton.get('updated_at', 'N/A')}")
        
        # 統計信息
        stats = self.get_stats()
        print(f"\n📊 統計信息:")
        print(f"   部門數: {stats.get('total_divisions', 0)}")
        print(f"   段落數: {stats.get('total_segments', 0)}")
        print(f"   區塊數: {stats.get('total_blocks', 0)}")
        print(f"   總字數: {stats.get('total_words', 0):,}")
        print(f"   完成度: {stats.get('completion_percentage', 0)}%")
        print(f"   ├─ 已完成: {stats.get('complete_segments', 0)}")
        print(f"   ├─ 進行中: {stats.get('in_progress_segments', 0)}")
        print(f"   └─ 待處理: {stats.get('pending_segments', 0)}")
        print(f"   鉤子數: {stats.get('total_hooks', 0)}")
        print(f"   張力源: {stats.get('tension_sources', 0)} (未解決: {stats.get('unresolved_tensions', 0)})")
        print(f"   合成張力: {stats.get('resultant_magnitude', 0):.2f}")
        
        # 驗證結果
        print(f"\n✅ 驗證結果: {'通過' if passed else '失敗'}")
        
        if errors:
            print(f"\n❌ 錯誤 ({len(errors)}):")
            for err in errors:
                print(f"   • {err}")
        
        if warnings:
            print(f"\n⚠️  警告 ({len(warnings)}):")
            for warn in warnings:
                print(f"   • {warn}")
        
        if not errors and not warnings:
            print(f"\n   無錯誤，無警告")
        
        print("\n" + "=" * 60)
        
        return passed


def validate_file(filepath: str, schema_path: str = None) -> bool:
    """驗證單個文件"""
    
    if not os.path.exists(filepath):
        print(f"錯誤: 文件不存在 - {filepath}")
        return False
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            skeleton = json.load(f)
    except json.JSONDecodeError as e:
        print(f"錯誤: JSON 解析失敗 - {filepath}")
        print(f"       {e}")
        return False
    
    validator = SkeletonValidator(schema_path)
    return validator.print_report(skeleton, filepath)


def main():
    """主函數"""
    
    # 確定 schema 路徑
    script_dir = os.path.dirname(os.path.abspath(__file__))
    schema_path = os.path.join(script_dir, 'schemas', 'skeleton-schema.json')
    
    if not os.path.exists(schema_path):
        print(f"警告: Schema 文件未找到 - {schema_path}")
        schema_path = None
    
    if len(sys.argv) < 2:
        print("用法: python validate_skeleton.py <skeleton.json>")
        print("      python validate_skeleton.py --all")
        print("\n選項:")
        print("  --all    驗證 examples 目錄下所有 JSON 文件")
        sys.exit(1)
    
    if sys.argv[1] == '--all':
        # 驗證所有示例
        examples_dir = os.path.join(script_dir, 'examples')
        if not os.path.exists(examples_dir):
            print(f"錯誤: examples 目錄不存在 - {examples_dir}")
            sys.exit(1)
        
        json_files = [f for f in os.listdir(examples_dir) if f.endswith('.json')]
        
        if not json_files:
            print("examples 目錄中沒有 JSON 文件")
            sys.exit(1)
        
        results = []
        for filename in sorted(json_files):
            filepath = os.path.join(examples_dir, filename)
            passed = validate_file(filepath, schema_path)
            results.append((filename, passed))
        
        # 總結
        print("\n" + "=" * 60)
        print("總結")
        print("=" * 60)
        passed_count = sum(1 for _, p in results if p)
        print(f"通過: {passed_count}/{len(results)}")
        for filename, passed in results:
            status = "✅" if passed else "❌"
            print(f"  {status} {filename}")
        
    else:
        # 驗證單個文件
        filepath = sys.argv[1]
        passed = validate_file(filepath, schema_path)
        sys.exit(0 if passed else 1)


if __name__ == '__main__':
    main()
