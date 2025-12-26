#!/usr/bin/env node
/**
 * Semantic Skeleton Schema Validator (JavaScript/Node.js)
 * 語義骨架 Schema 驗證器
 * 
 * 功能：
 * 1. 驗證骨架 JSON 是否符合 Schema 規範
 * 2. 檢查結構完整性
 * 3. 驗證鉤子一致性
 * 4. 計算張力場統計
 * 
 * 使用方式：
 *     node validate_skeleton.js <skeleton.json>
 *     node validate_skeleton.js --all
 * 
 * 安裝依賴：
 *     npm install ajv ajv-formats
 */

const fs = require('fs');
const path = require('path');

// 嘗試導入 ajv（JSON Schema 驗證庫）
let Ajv, addFormats;
try {
    Ajv = require('ajv');
    addFormats = require('ajv-formats');
} catch (e) {
    console.log('警告: ajv 未安裝，將使用基本驗證模式');
    console.log('安裝: npm install ajv ajv-formats');
}

class SkeletonValidator {
    constructor(schemaPath = null) {
        this.schema = null;
        this.errors = [];
        this.warnings = [];
        this.stats = {};
        this.ajv = null;

        if (schemaPath && fs.existsSync(schemaPath)) {
            this.schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
            if (Ajv) {
                this.ajv = new Ajv({ allErrors: true, strict: false });
                if (addFormats) {
                    addFormats(this.ajv);
                }
            }
        }
    }

    validate(skeleton) {
        this.errors = [];
        this.warnings = [];
        this.stats = {};

        // 1. Schema 驗證
        if (this.ajv && this.schema) {
            this._validateSchema(skeleton);
        }

        // 2. 結構完整性驗證
        this._validateStructure(skeleton);

        // 3. 鉤子一致性驗證
        this._validateHooks(skeleton);

        // 4. 張力場驗證
        this._validateTensionField(skeleton);

        // 5. 版本一致性驗證
        this._validateVersioning(skeleton);

        // 6. 計算統計
        this._calculateStats(skeleton);

        return {
            passed: this.errors.length === 0,
            errors: this.errors,
            warnings: this.warnings
        };
    }

    _validateSchema(skeleton) {
        const validate = this.ajv.compile(this.schema);
        const valid = validate(skeleton);
        
        if (!valid) {
            validate.errors.forEach(err => {
                this.errors.push(`Schema 驗證失敗: ${err.message} (路徑: ${err.instancePath})`);
            });
        }
    }

    _validateStructure(skeleton) {
        // 檢查必填字段
        const requiredFields = [
            'schema_version', 'skeleton_version', 'created_at',
            'updated_at', 'divisions', 'tension_field', 'metadata'
        ];
        
        requiredFields.forEach(field => {
            if (!(field in skeleton)) {
                this.errors.push(`缺少必填字段: ${field}`);
            }
        });

        // 檢查 divisions 結構
        if (skeleton.divisions) {
            const segmentIds = new Set();
            
            skeleton.divisions.forEach((division, divIdx) => {
                if (!division.id) {
                    this.errors.push(`Division [${divIdx}] 缺少 id`);
                }
                if (!division.segments) {
                    this.errors.push(`Division [${divIdx}] 缺少 segments`);
                    return;
                }

                division.segments.forEach((segment, segIdx) => {
                    const segId = segment.id;
                    if (segmentIds.has(segId)) {
                        this.errors.push(`Segment ID ${segId} 重複`);
                    }
                    if (segId) {
                        segmentIds.add(segId);
                    }

                    // 檢查 blocks
                    if (segment.blocks) {
                        const blockTypes = segment.blocks.map(b => b.type);
                        const nonCustom = blockTypes.filter(t => t !== 'custom');
                        if (nonCustom.length !== new Set(nonCustom).size) {
                            this.warnings.push(`Segment ${segId} 有重複的 block type`);
                        }
                    }
                });
            });
        }
    }

    _validateHooks(skeleton) {
        const allHooks = [];
        const hookIds = new Set();

        // 收集所有鉤子
        (skeleton.divisions || []).forEach(division => {
            (division.division_hooks || []).forEach(hook => {
                allHooks.push({ type: 'division', parentId: division.id, hook });
            });

            (division.segments || []).forEach(segment => {
                (segment.segment_hooks || []).forEach(hook => {
                    allHooks.push({ type: 'segment', parentId: segment.id, hook });
                });

                if (segment.entry_hook) {
                    allHooks.push({ type: 'entry', parentId: segment.id, hook: segment.entry_hook });
                }
                if (segment.exit_hook) {
                    allHooks.push({ type: 'exit', parentId: segment.id, hook: segment.exit_hook });
                }
            });
        });

        (skeleton.global_hooks || []).forEach(hook => {
            allHooks.push({ type: 'global', parentId: null, hook });
        });

        // 驗證每個鉤子
        allHooks.forEach(({ type, parentId, hook }) => {
            const hookId = hook.hook_id;

            if (hookIds.has(hookId)) {
                this.warnings.push(`鉤子 ID ${hookId} 重複使用（可能是跨段引用）`);
            }
            hookIds.add(hookId);

            // 檢查三位一體完整性
            const hasSemantic = hook.semantic && Object.keys(hook.semantic).length > 0;
            const hasStructural = hook.structural && Object.keys(hook.structural).length > 0;
            const hasTonal = hook.tonal && Object.keys(hook.tonal).length > 0;

            if (hasStructural && !hasSemantic && !hasTonal) {
                this.warnings.push(`鉤子 ${hookId} 只有 structural，缺少 semantic 和 tonal`);
            }

            // 檢查信度
            const confidence = hook.confidence || 1.0;
            if (confidence < 0.5) {
                this.warnings.push(`鉤子 ${hookId} 信度過低 (${confidence})`);
            }
        });
    }

    _validateTensionField(skeleton) {
        const tensionField = skeleton.tension_field || {};
        const sources = tensionField.sources || [];
        const resultant = tensionField.resultant || {};

        // 收集所有 segment ID
        const allSegmentIds = new Set();
        (skeleton.divisions || []).forEach(division => {
            (division.segments || []).forEach(segment => {
                allSegmentIds.add(segment.id);
            });
        });

        // 檢查張力源引用
        sources.forEach(source => {
            const segId = source.source_segment;
            if (segId && !allSegmentIds.has(segId)) {
                this.errors.push(`張力源引用不存在的 Segment: ${segId}`);
            }
        });

        // 檢查合成向量方向
        const primary = resultant.primary_direction || '';
        if (primary) {
            const match = primary.match(/segment[_\s]*(\d+)/i);
            if (match) {
                const refId = parseInt(match[1]);
                if (!allSegmentIds.has(refId)) {
                    this.warnings.push(`張力場 primary_direction 引用可能無效: ${primary}`);
                }
            }
        }

        // 檢查張力強度總和
        const totalIntensity = sources
            .filter(s => !s.resolved)
            .reduce((sum, s) => sum + (s.intensity || 0), 0);
        
        if (totalIntensity > 3.0) {
            this.warnings.push(`未解決張力總強度過高 (${totalIntensity.toFixed(2)})，可能需要分解任務`);
        }
    }

    _validateVersioning(skeleton) {
        const schemaVersion = skeleton.schema_version || '';
        const skeletonVersion = skeleton.skeleton_version || '';

        // 檢查版本號格式
        const versionPattern = /^\d+\.\d+\.\d+$/;
        if (!versionPattern.test(schemaVersion)) {
            this.errors.push(`schema_version 格式錯誤: ${schemaVersion}`);
        }
        if (!versionPattern.test(skeletonVersion)) {
            this.errors.push(`skeleton_version 格式錯誤: ${skeletonVersion}`);
        }

        // 檢查時間順序
        const created = skeleton.created_at || '';
        const updated = skeleton.updated_at || '';
        if (created && updated) {
            const createdDt = new Date(created);
            const updatedDt = new Date(updated);
            if (updatedDt < createdDt) {
                this.errors.push('updated_at 早於 created_at');
            }
        }

        // 檢查 changelog
        const changelog = skeleton.changelog || [];
        if (changelog.length > 0) {
            const versionsInLog = changelog.map(entry => entry.version);
            if (!versionsInLog.includes(skeletonVersion)) {
                this.warnings.push(`當前版本 ${skeletonVersion} 未在 changelog 中記錄`);
            }
        }
    }

    _calculateStats(skeleton) {
        let totalDivisions = 0;
        let totalSegments = 0;
        let totalBlocks = 0;
        let totalWords = 0;
        let completeSegments = 0;
        let inProgressSegments = 0;
        let pendingSegments = 0;
        let totalHooks = 0;

        (skeleton.divisions || []).forEach(division => {
            totalDivisions++;
            (division.segments || []).forEach(segment => {
                totalSegments++;
                totalWords += segment.word_count || 0;

                const status = segment.status || 'pending';
                if (status === 'complete') completeSegments++;
                else if (status === 'in_progress') inProgressSegments++;
                else pendingSegments++;

                totalBlocks += (segment.blocks || []).length;
                totalHooks += (segment.segment_hooks || []).length;
                if (segment.entry_hook) totalHooks++;
                if (segment.exit_hook) totalHooks++;
            });

            totalHooks += (division.division_hooks || []).length;
        });

        totalHooks += (skeleton.global_hooks || []).length;

        // 張力統計
        const tensionField = skeleton.tension_field || {};
        const sources = tensionField.sources || [];
        const unresolvedTensions = sources.filter(s => !s.resolved);

        this.stats = {
            totalDivisions,
            totalSegments,
            totalBlocks,
            totalWords,
            completeSegments,
            inProgressSegments,
            pendingSegments,
            completionPercentage: totalSegments > 0 
                ? Math.round(completeSegments / totalSegments * 10000) / 100 
                : 0,
            totalHooks,
            tensionSources: sources.length,
            unresolvedTensions: unresolvedTensions.length,
            resultantMagnitude: (tensionField.resultant || {}).magnitude || 0
        };
    }

    getStats() {
        return this.stats;
    }

    printReport(skeleton, filename = '') {
        const result = this.validate(skeleton);

        console.log('\n' + '='.repeat(60));
        console.log('語義骨架驗證報告');
        if (filename) {
            console.log(`文件: ${filename}`);
        }
        console.log('='.repeat(60));

        // 基本信息
        console.log('\n📋 基本信息:');
        console.log(`   標題: ${skeleton.title || 'N/A'}`);
        console.log(`   Schema 版本: ${skeleton.schema_version || 'N/A'}`);
        console.log(`   骨架版本: ${skeleton.skeleton_version || 'N/A'}`);
        console.log(`   創建時間: ${skeleton.created_at || 'N/A'}`);
        console.log(`   更新時間: ${skeleton.updated_at || 'N/A'}`);

        // 統計信息
        const stats = this.getStats();
        console.log('\n📊 統計信息:');
        console.log(`   部門數: ${stats.totalDivisions}`);
        console.log(`   段落數: ${stats.totalSegments}`);
        console.log(`   區塊數: ${stats.totalBlocks}`);
        console.log(`   總字數: ${stats.totalWords.toLocaleString()}`);
        console.log(`   完成度: ${stats.completionPercentage}%`);
        console.log(`   ├─ 已完成: ${stats.completeSegments}`);
        console.log(`   ├─ 進行中: ${stats.inProgressSegments}`);
        console.log(`   └─ 待處理: ${stats.pendingSegments}`);
        console.log(`   鉤子數: ${stats.totalHooks}`);
        console.log(`   張力源: ${stats.tensionSources} (未解決: ${stats.unresolvedTensions})`);
        console.log(`   合成張力: ${stats.resultantMagnitude.toFixed(2)}`);

        // 驗證結果
        console.log(`\n✅ 驗證結果: ${result.passed ? '通過' : '失敗'}`);

        if (result.errors.length > 0) {
            console.log(`\n❌ 錯誤 (${result.errors.length}):`);
            result.errors.forEach(err => console.log(`   • ${err}`));
        }

        if (result.warnings.length > 0) {
            console.log(`\n⚠️  警告 (${result.warnings.length}):`);
            result.warnings.forEach(warn => console.log(`   • ${warn}`));
        }

        if (result.errors.length === 0 && result.warnings.length === 0) {
            console.log('\n   無錯誤，無警告');
        }

        console.log('\n' + '='.repeat(60));

        return result.passed;
    }
}

function validateFile(filepath, schemaPath = null) {
    if (!fs.existsSync(filepath)) {
        console.log(`錯誤: 文件不存在 - ${filepath}`);
        return false;
    }

    let skeleton;
    try {
        skeleton = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    } catch (e) {
        console.log(`錯誤: JSON 解析失敗 - ${filepath}`);
        console.log(`       ${e.message}`);
        return false;
    }

    const validator = new SkeletonValidator(schemaPath);
    return validator.printReport(skeleton, filepath);
}

function main() {
    const scriptDir = __dirname;
    const schemaPath = path.join(scriptDir, 'schemas', 'skeleton-schema.json');

    if (!fs.existsSync(schemaPath)) {
        console.log(`警告: Schema 文件未找到 - ${schemaPath}`);
    }

    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.log('用法: node validate_skeleton.js <skeleton.json>');
        console.log('      node validate_skeleton.js --all');
        console.log('\n選項:');
        console.log('  --all    驗證 examples 目錄下所有 JSON 文件');
        process.exit(1);
    }

    if (args[0] === '--all') {
        const examplesDir = path.join(scriptDir, 'examples');
        if (!fs.existsSync(examplesDir)) {
            console.log(`錯誤: examples 目錄不存在 - ${examplesDir}`);
            process.exit(1);
        }

        const jsonFiles = fs.readdirSync(examplesDir)
            .filter(f => f.endsWith('.json'))
            .sort();

        if (jsonFiles.length === 0) {
            console.log('examples 目錄中沒有 JSON 文件');
            process.exit(1);
        }

        const results = [];
        jsonFiles.forEach(filename => {
            const filepath = path.join(examplesDir, filename);
            const passed = validateFile(filepath, schemaPath);
            results.push({ filename, passed });
        });

        // 總結
        console.log('\n' + '='.repeat(60));
        console.log('總結');
        console.log('='.repeat(60));
        const passedCount = results.filter(r => r.passed).length;
        console.log(`通過: ${passedCount}/${results.length}`);
        results.forEach(({ filename, passed }) => {
            const status = passed ? '✅' : '❌';
            console.log(`  ${status} ${filename}`);
        });

    } else {
        const filepath = args[0];
        const passed = validateFile(filepath, schemaPath);
        process.exit(passed ? 0 : 1);
    }
}

main();
