// 설비 데이터 구조화 도구 - 메인 JavaScript
class EquipmentNetworkMapper {
    constructor() {
        this.currentData = null;
        this.simulation = null;
        this.svg = null;
        this.g = null;
        this.selectedNode = null;
        this.zoom = null;
        this.isRealTimeMode = true;
        
        // 설비 타입별 색상 정의 (전문적인 색상)
        this.equipmentColors = {
            'production': '#1E40AF',   // 딥 블루 (생산설비)
            'utility': '#0D9488',      // 틸 (유틸리티)
            'safety': '#EA580C',       // 안전 오렌지
            'quality': '#10B981',      // 에메랄드 (품질)
            'maintenance': '#CA8A04',  // 골드 (정비)
            'default': '#64748B'       // 중성 그레이
        };
        
        // 설비 상태별 색상
        this.statusColors = {
            'normal': '#22C55E',       // 연한 그린
            'warning': '#F59E0B',      // 앰버
            'critical': '#EF4444',     // 빨강
            'maintenance': '#6B7280'   // 그레이
        };
        
        this.init();
    }
    
    init() {
        this.initializeEventListeners();
        this.initializeSVG();
        this.initializeTheme(); // 테마 초기화 추가
        this.loadSampleData();
        this.startRealTimeUpdates();
        this.loadSharedData(); // 공유된 데이터 확인 및 로드
    }
    
    initializeEventListeners() {
        // 파일 업로드
        document.getElementById('file-upload').addEventListener('change', (e) => this.handleFileUpload(e));
        document.getElementById('upload-btn').addEventListener('click', () => {
            document.getElementById('file-upload').click();
        });
        
        // 컨트롤 이벤트
        document.getElementById('node-size').addEventListener('input', (e) => this.updateNodeSize(e.target.value));
        document.getElementById('link-distance').addEventListener('input', (e) => this.updateLinkDistance(e.target.value));
        document.getElementById('charge').addEventListener('input', (e) => this.updateCharge(e.target.value));
        document.getElementById('layout-select').addEventListener('change', (e) => this.changeLayout(e.target.value));
        
        // 필터 이벤트
        document.querySelectorAll('.equipment-filter').forEach(filter => {
            filter.addEventListener('change', () => this.applyFilters());
        });
        
        // 버튼 이벤트
        document.getElementById('reset-view').addEventListener('click', () => this.resetView());
        document.getElementById('apply-settings').addEventListener('click', () => this.applySettings());
        document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());
        document.getElementById('fit-view').addEventListener('click', () => this.fitToView());
        
        // 실시간 모니터링 토글
        document.getElementById('realtime-toggle').addEventListener('change', (e) => {
            this.isRealTimeMode = e.target.checked;
            if (this.isRealTimeMode) {
                this.startRealTimeUpdates();
            } else {
                this.stopRealTimeUpdates();
            }
        });
        
        // 사이드바 토글
        document.getElementById('toggle-sidebar').addEventListener('click', () => this.toggleSidebar());
        
        // 검색 기능
        document.getElementById('search-input').addEventListener('input', (e) => this.searchEquipment(e.target.value));
        
        // 필터 버튼
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });
        
        // 내보내기 기능
        document.getElementById('export-btn').addEventListener('click', () => this.exportData());
        
        // 새로 추가된 기능들
        document.getElementById('report-btn').addEventListener('click', () => this.showReportModal());
        
        // 새로고침 버튼
        document.getElementById('sync-btn').addEventListener('click', () => this.refreshData());
        
        // 설정 버튼 (상단 네비게이션)
        document.getElementById('settings-btn').addEventListener('click', () => this.showSettingsModal());
        
        // 공유 버튼 (메인 컨텐츠 영역)
        document.getElementById('share-btn').addEventListener('click', () => this.showShareModal());
        
        // 테마 토글 버튼
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());
        
        // 프로필 드롭다운
        this.initializeDropdowns();
        
        // 모달 이벤트 리스너들
        this.initializeModalEventListeners();
        
        // 사이드바 이벤트 리스너들
        this.initializeSidebarEventListeners();
    }
    
    initializeSidebarEventListeners() {
        // 실시간 모니터링 목록의 설비 클릭
        document.querySelectorAll('.file-item[data-equipment-id]').forEach(item => {
            item.addEventListener('click', (e) => {
                const equipmentId = e.currentTarget.dataset.equipmentId;
                this.handleEquipmentClick(equipmentId);
            });
        });
        
        // 설비 트리의 설비 클릭
        document.querySelectorAll('[data-equipment-id]:not(.file-item)').forEach(item => {
            item.addEventListener('click', (e) => {
                const equipmentId = e.currentTarget.dataset.equipmentId;
                this.handleEquipmentClick(equipmentId);
            });
        });
        
        // 건물/위치 클릭
        document.querySelectorAll('[data-location]').forEach(item => {
            item.addEventListener('click', (e) => {
                const location = e.currentTarget.dataset.location;
                this.handleLocationClick(location);
            });
        });
        
        // 사이드바 기능 버튼들
        const refreshMonitoringBtn = document.getElementById('refresh-monitoring');
        const showStatsChartBtn = document.getElementById('show-stats-chart');
        
        if (refreshMonitoringBtn) {
            refreshMonitoringBtn.addEventListener('click', () => this.refreshMonitoringData());
        }
        
        if (showStatsChartBtn) {
            showStatsChartBtn.addEventListener('click', () => this.showStatsChart());
        }
    }
    
    initializeModalEventListeners() {
        // 노드 상세 모달
        document.getElementById('close-node-modal').addEventListener('click', () => this.hideModal('node-detail-modal'));
        
        // 리포트 모달
        document.getElementById('close-report-modal').addEventListener('click', () => this.hideModal('report-modal'));
        document.getElementById('download-report').addEventListener('click', () => this.downloadReport());
        document.getElementById('download-report-image').addEventListener('click', () => this.downloadReportAsImage());
        
        // 공유 모달
        document.getElementById('close-share-modal').addEventListener('click', () => this.hideModal('share-modal'));
        document.getElementById('copy-link').addEventListener('click', () => this.copyShareLink());
        
        // 공유 모달 내 이메일/카카오톡 버튼들
        const emailShareBtn = document.querySelector('#share-modal .btn-info');
        const kakaoShareBtn = document.querySelector('#share-modal .btn-success');
        
        if (emailShareBtn) {
            emailShareBtn.addEventListener('click', () => this.shareViaEmail());
        }
        if (kakaoShareBtn) {
            kakaoShareBtn.addEventListener('click', () => this.shareViaKakao());
        }
        
        // 설정 모달
        document.getElementById('close-settings-modal').addEventListener('click', () => this.hideModal('settings-modal'));
        document.getElementById('save-settings').addEventListener('click', () => this.saveSettings());
        document.getElementById('reset-settings').addEventListener('click', () => this.resetSettings());
        
        // 모달 외부 클릭 시 닫기
        document.querySelectorAll('[id$="-modal"]').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });
        
        // ESC 키로 모달 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModals = document.querySelectorAll('[id$="-modal"]:not(.hidden)');
                if (openModals.length > 0) {
                    this.hideModal(openModals[openModals.length - 1].id);
                }
            }
        });
    }
    
    initializeSVG() {
        const container = document.getElementById('network-container');
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        this.svg = d3.select('#networkGraph')
            .attr('width', width)
            .attr('height', height);
        
        // 줌 기능 설정
        this.zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                this.g.attr('transform', event.transform);
            });
        
        this.svg.call(this.zoom);
        
        // 메인 그룹 생성
        this.g = this.svg.append('g');
        
        // 화살표 마커 정의 (크기 조정)
        const defs = this.svg.append('defs');
        
        // 일반 화살표 (크기 축소)
        defs.append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '0 -3 6 6')
            .attr('refX', 12)
            .attr('refY', 0)
            .attr('markerWidth', 4)
            .attr('markerHeight', 4)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-3L6,0L0,3')
            .attr('fill', '#64748B');
        
        // 강조된 화살표 (크기 축소)
        defs.append('marker')
            .attr('id', 'arrowhead-highlighted')
            .attr('viewBox', '0 -3 6 6')
            .attr('refX', 12)
            .attr('refY', 0)
            .attr('markerWidth', 5)
            .attr('markerHeight', 5)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-3L6,0L0,3')
            .attr('fill', '#2563EB');
    }
    
    loadSampleData() {
        // 실제 설비 데이터 샘플 (실무환경 기반)
        const sampleData = {
            nodes: [
                // 생산 설비 (라인별 구성)
                { id: 'EXT-2847', label: 'LINE-A 압출기', type: 'production', status: 'warning', department: '생산1팀', location: 'A동-1층-101호', capacity: '200kg/h', power: '50kW' },
                { id: 'MIX-1456', label: 'LINE-A 혼합기', type: 'production', status: 'normal', department: '생산1팀', location: 'A동-1층-102호', capacity: '150kg/batch', power: '30kW' },
                { id: 'CONV-B2-1456', label: 'LINE-A 컨베이어', type: 'production', status: 'critical', department: '생산1팀', location: 'A동-1층-103호', speed: '2m/min', power: '5kW' },
                { id: 'PKG-3000', label: 'LINE-B 포장기', type: 'production', status: 'normal', department: '포장팀', location: 'B동-2층-201호', throughput: '100개/min', power: '25kW' },
                { id: 'CUT-7890', label: 'LINE-B 절단기', type: 'production', status: 'normal', department: '생산2팀', location: 'B동-1층-105호', speed: '50cuts/min', power: '15kW' },
                { id: 'WELD-4567', label: 'LINE-C 용접기', type: 'production', status: 'maintenance', department: '생산3팀', location: 'C동-1층-301호', current: '300A', power: '40kW' },
                
                // 유틸리티 시스템
                { id: 'COOL-SYS-8901', label: '중앙냉각시스템', type: 'utility', status: 'normal', department: '설비팀', location: '유틸리티동-지하1층', capacity: '500L/min', temp: '15-25°C' },
                { id: 'COMP-AIR-2345', label: '압축공기시스템', type: 'utility', status: 'normal', department: '설비팀', location: '유틸리티동-1층', pressure: '8bar', flow: '100L/min' },
                { id: 'BOILER-9876', label: '스팀보일러', type: 'utility', status: 'warning', department: '설비팀', location: '유틸리티동-지하1층', pressure: '10bar', temp: '180°C' },
                { id: 'ELEC-MAIN-5432', label: '주배전반', type: 'utility', status: 'normal', department: '전기팀', location: '전기실-1층', voltage: '22.9kV', capacity: '2000kVA' },
                { id: 'WATER-TREAT-6789', label: '수처리시설', type: 'utility', status: 'normal', department: '환경팀', location: '환경동-1층', capacity: '200m³/day', efficiency: '99.5%' },
                
                // 안전 시스템
                { id: 'SAFETY-EMG-7734', label: '비상정지시스템', type: 'safety', status: 'normal', department: '안전팀', location: '전체구역', response: '0.5초', coverage: '100%' },
                { id: 'FIRE-DETECT-1122', label: '화재감지시스템', type: 'safety', status: 'normal', department: '안전팀', location: '전체구역', sensors: '247개', response: '30초' },
                { id: 'GAS-DETECT-3344', label: '가스누출감지기', type: 'safety', status: 'normal', department: '안전팀', location: 'A동-B동-C동', sensitivity: '10ppm', alarm: '자동' },
                { id: 'SAFETY-VALVE-5566', label: '안전밸브시스템', type: 'safety', status: 'normal', department: '안전팀', location: '압력설비', pressure: '12bar', type_valve: '스프링식' },
                { id: 'VENTILATION-7788', label: '환기시스템', type: 'safety', status: 'warning', department: '안전팀', location: '전체구역', airflow: '15000m³/h', efficiency: '95%' },
                
                // 품질 관리 시스템
                { id: 'QC-SENSOR-9900', label: '품질센서시스템', type: 'quality', status: 'normal', department: '품질팀', location: 'LINE-A출구', accuracy: '±0.1%', sampling: '1초' },
                { id: 'INSPECT-AUTO-1133', label: '자동검사장비', type: 'quality', status: 'normal', department: '품질팀', location: 'B동-검사실', throughput: '200개/h', accuracy: '99.8%' },
                { id: 'LAB-EQUIP-2244', label: '실험실장비', type: 'quality', status: 'normal', department: '품질팀', location: '품질관리실', tests: '15종', precision: '±0.05%' },
                { id: 'WEIGHT-CHECK-3355', label: '중량검사기', type: 'quality', status: 'warning', department: '품질팀', location: 'LINE-B출구', range: '0.1-50kg', accuracy: '±1g' },
                
                // 유지보수 시스템
                { id: 'MAINT-TOOL-4466', label: '정비도구시스템', type: 'maintenance', status: 'normal', department: '정비팀', location: '정비창고-1층', tools: '247종', availability: '95%' },
                { id: 'SPARE-PARTS-5577', label: '예비부품창고', type: 'maintenance', status: 'normal', department: '정비팀', location: '부품창고-2층', items: '1247종', stock: '85%' },
                { id: 'CRANE-OVERHEAD-6688', label: '천장크레인', type: 'maintenance', status: 'normal', department: '정비팀', location: 'A동-B동', capacity: '10ton', reach: '20m' },
                { id: 'DIAGNOSTIC-7799', label: '진단장비시스템', type: 'maintenance', status: 'normal', department: '정비팀', location: '정비실', tests: '25종', accuracy: '99%' }
            ],
            links: [
                // 주요 생산 라인 연결
                { source: 'MIX-1456', target: 'EXT-2847', type: 'process', strength: 'high', flow: '원료공급' },
                { source: 'EXT-2847', target: 'CONV-B2-1456', type: 'process', strength: 'high', flow: '제품이송' },
                { source: 'CONV-B2-1456', target: 'CUT-7890', type: 'process', strength: 'high', flow: '절단공정' },
                { source: 'CUT-7890', target: 'PKG-3000', type: 'process', strength: 'high', flow: '포장공정' },
                { source: 'WELD-4567', target: 'PKG-3000', type: 'process', strength: 'medium', flow: '용접후포장' },
                
                // 유틸리티 공급 연결
                { source: 'COOL-SYS-8901', target: 'EXT-2847', type: 'utility', strength: 'high', flow: '냉각수공급' },
                { source: 'COOL-SYS-8901', target: 'WELD-4567', type: 'utility', strength: 'medium', flow: '냉각수공급' },
                { source: 'COMP-AIR-2345', target: 'MIX-1456', type: 'utility', strength: 'medium', flow: '압축공기' },
                { source: 'COMP-AIR-2345', target: 'PKG-3000', type: 'utility', strength: 'medium', flow: '압축공기' },
                { source: 'BOILER-9876', target: 'EXT-2847', type: 'utility', strength: 'low', flow: '스팀공급' },
                { source: 'ELEC-MAIN-5432', target: 'EXT-2847', type: 'utility', strength: 'high', flow: '전력공급' },
                { source: 'ELEC-MAIN-5432', target: 'MIX-1456', type: 'utility', strength: 'high', flow: '전력공급' },
                { source: 'ELEC-MAIN-5432', target: 'WELD-4567', type: 'utility', strength: 'high', flow: '전력공급' },
                { source: 'WATER-TREAT-6789', target: 'COOL-SYS-8901', type: 'utility', strength: 'medium', flow: '처리수공급' },
                
                // 안전 시스템 연결
                { source: 'SAFETY-EMG-7734', target: 'EXT-2847', type: 'safety', strength: 'high', flow: '비상정지신호' },
                { source: 'SAFETY-EMG-7734', target: 'MIX-1456', type: 'safety', strength: 'high', flow: '비상정지신호' },
                { source: 'SAFETY-EMG-7734', target: 'WELD-4567', type: 'safety', strength: 'high', flow: '비상정지신호' },
                { source: 'FIRE-DETECT-1122', target: 'EXT-2847', type: 'safety', strength: 'medium', flow: '화재감지' },
                { source: 'FIRE-DETECT-1122', target: 'PKG-3000', type: 'safety', strength: 'medium', flow: '화재감지' },
                { source: 'GAS-DETECT-3344', target: 'WELD-4567', type: 'safety', strength: 'high', flow: '가스감지' },
                { source: 'SAFETY-VALVE-5566', target: 'BOILER-9876', type: 'safety', strength: 'high', flow: '압력보호' },
                { source: 'VENTILATION-7788', target: 'WELD-4567', type: 'safety', strength: 'medium', flow: '환기' },
                
                // 품질 관리 연결
                { source: 'QC-SENSOR-9900', target: 'EXT-2847', type: 'monitoring', strength: 'high', flow: '품질모니터링' },
                { source: 'INSPECT-AUTO-1133', target: 'PKG-3000', type: 'monitoring', strength: 'high', flow: '자동검사' },
                { source: 'WEIGHT-CHECK-3355', target: 'CUT-7890', type: 'monitoring', strength: 'medium', flow: '중량검사' },
                { source: 'LAB-EQUIP-2244', target: 'QC-SENSOR-9900', type: 'monitoring', strength: 'low', flow: '정밀분석' },
                
                // 유지보수 연결
                { source: 'MAINT-TOOL-4466', target: 'EXT-2847', type: 'maintenance', strength: 'medium', flow: '정비작업' },
                { source: 'MAINT-TOOL-4466', target: 'MIX-1456', type: 'maintenance', strength: 'medium', flow: '정비작업' },
                { source: 'MAINT-TOOL-4466', target: 'WELD-4567', type: 'maintenance', strength: 'high', flow: '정비작업' },
                { source: 'SPARE-PARTS-5577', target: 'MAINT-TOOL-4466', type: 'supply', strength: 'high', flow: '부품공급' },
                { source: 'CRANE-OVERHEAD-6688', target: 'EXT-2847', type: 'maintenance', strength: 'low', flow: '중량물이동' },
                { source: 'CRANE-OVERHEAD-6688', target: 'WELD-4567', type: 'maintenance', strength: 'medium', flow: '중량물이동' },
                { source: 'DIAGNOSTIC-7799', target: 'EXT-2847', type: 'monitoring', strength: 'medium', flow: '설비진단' },
                { source: 'DIAGNOSTIC-7799', target: 'BOILER-9876', type: 'monitoring', strength: 'high', flow: '설비진단' }
            ]
        };
        
        this.currentData = sampleData;
        this.createNetworkVisualization(sampleData);
        this.updateStats();
    }
    
    createNetworkVisualization(data) {
        if (!data.nodes || data.nodes.length === 0) {
            console.warn('시각화할 데이터가 없습니다.');
            return;
        }
        
        const container = document.getElementById('network-container');
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        // 기존 시각화 제거
        this.g.selectAll('*').remove();
        
        // 시뮬레이션 설정
        const nodeSize = parseInt(document.getElementById('node-size').value);
        const linkDistance = parseInt(document.getElementById('link-distance').value);
        const charge = parseInt(document.getElementById('charge').value);
        
        this.simulation = d3.forceSimulation(data.nodes)
            .force('link', d3.forceLink(data.links).id(d => d.id).distance(linkDistance))
            .force('charge', d3.forceManyBody().strength(charge))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(nodeSize + 5));
        
        // 링크 생성
        const link = this.g.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(data.links)
            .enter().append('line')
            .attr('class', 'link')
            .attr('stroke', d => this.getLinkColor(d.type))
            .attr('stroke-width', d => this.getLinkWidth(d.strength))
            .attr('stroke-opacity', 0.6)
            .attr('marker-end', 'url(#arrowhead)');
        
        // 노드 그룹 생성
        const nodeGroup = this.g.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(data.nodes)
            .enter().append('g')
            .attr('class', 'node-group')
            .call(d3.drag()
                .on('start', (event, d) => this.dragstarted(event, d))
                .on('drag', (event, d) => this.dragged(event, d))
                .on('end', (event, d) => this.dragended(event, d)));
        
        // 노드 원 생성
        const node = nodeGroup.append('circle')
            .attr('class', 'node')
            .attr('r', d => this.getNodeSize(d, nodeSize))
            .attr('fill', d => this.equipmentColors[d.type] || this.equipmentColors.default)
            .attr('stroke', d => this.statusColors[d.status])
            .attr('stroke-width', 3)
            .on('click', (event, d) => this.handleNodeClick(event, d))
            .on('mouseover', (event, d) => this.handleNodeMouseOver(event, d))
            .on('mouseout', (event, d) => this.handleNodeMouseOut(event, d));
        
        // 상태 표시 점
        nodeGroup.append('circle')
            .attr('class', 'status-indicator')
            .attr('r', 4)
            .attr('cx', d => this.getNodeSize(d, nodeSize) * 0.7)
            .attr('cy', d => -this.getNodeSize(d, nodeSize) * 0.7)
            .attr('fill', d => this.statusColors[d.status])
            .attr('stroke', '#2F3136')
            .attr('stroke-width', 1);
        
        // 노드 라벨 생성
        const label = nodeGroup.append('text')
            .attr('class', 'node-label')
            .attr('dy', d => this.getNodeSize(d, nodeSize) + 15)
            .text(d => this.truncateLabel(d.label, 12))
            .style('font-size', '10px');
        
        // 시뮬레이션 틱 이벤트
        this.simulation.on('tick', () => this.ticked());
        
        // 첫 번째 노드 정보 표시
        if (data.nodes.length > 0) {
            this.updateNodeInfo(data.nodes[0]);
        }
    }
    
    ticked() {
        // 링크 위치 업데이트
        this.g.selectAll('.link')
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
            
        // 노드 그룹 위치 업데이트
        this.g.selectAll('.node-group')
                .attr('transform', d => `translate(${d.x},${d.y})`);
    }
    
    getNodeSize(node, baseSize) {
        const sizeMultiplier = {
            'production': 1.2,
            'utility': 1.0,
            'safety': 1.1,
            'quality': 0.9,
            'maintenance': 0.8
        };
        return baseSize * (sizeMultiplier[node.type] || 1.0);
    }
    
    getLinkColor(type) {
        const colors = {
            'process': '#6E56CF',
            'utility': '#3B82F6',
            'safety': '#EF4444',
            'monitoring': '#10B981',
            'maintenance': '#F59E0B',
            'supply': '#8B949E'
        };
        return colors[type] || '#4A4A6A';
    }
    
    getLinkWidth(strength) {
        const widths = {
            'high': 3,
            'medium': 2,
            'low': 1
        };
        return widths[strength] || 1.5;
    }
    
    truncateLabel(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
    
    handleNodeClick(event, d) {
        event.stopPropagation();
        
        // 이전 선택 해제
        this.g.selectAll('.node').classed('selected', false);
        this.g.selectAll('.link').attr('marker-end', 'url(#arrowhead)').classed('highlighted', false);
        
        // 현재 노드 선택
        d3.select(event.currentTarget).classed('selected', true);
        this.selectedNode = d;
        
        // 연결된 링크 하이라이트
        this.g.selectAll('.link')
            .classed('highlighted', link => link.source.id === d.id || link.target.id === d.id)
            .attr('marker-end', link => 
                (link.source.id === d.id || link.target.id === d.id) ? 
                'url(#arrowhead-highlighted)' : 'url(#arrowhead)'
            );
        
        this.updateNodeInfo(d);
        
        // 상세 정보 모달 표시
        this.showNodeDetailModal(d);
    }
    
    handleNodeMouseOver(event, d) {
        // 툴팁 표시 (간단한 정보)
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('background', '#1E2124')
            .style('color', '#E3E5E8')
            .style('padding', '8px')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('z-index', '1000')
            .html(`
                <strong>${d.label}</strong><br>
                상태: ${this.getStatusText(d.status)}<br>
                부서: ${d.department}<br>
                위치: ${d.location}
            `);
        
        tooltip.style('left', (event.pageX + 10) + 'px')
               .style('top', (event.pageY - 10) + 'px');
        
        // 노드 크기 증가
        d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr('r', d => this.getNodeSize(d, parseInt(document.getElementById('node-size').value)) * 1.3);
    }
    
    handleNodeMouseOut(event, d) {
        // 툴팁 제거
        d3.selectAll('.tooltip').remove();
        
        // 노드 크기 복원
        d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr('r', d => this.getNodeSize(d, parseInt(document.getElementById('node-size').value)));
    }
    
    getStatusText(status) {
        const statusTexts = {
            'normal': '정상',
            'warning': '주의',
            'critical': '위험',
            'maintenance': '정비중'
        };
        return statusTexts[status] || '알 수 없음';
    }
    
    updateNodeInfo(node) {
        const nodeInfo = document.getElementById('node-info');
        
        const typeNames = {
            'production': '생산 설비',
            'utility': '유틸리티',
            'safety': '안전 시스템',
            'quality': '품질 관리',
            'maintenance': '유지보수'
        };
        
        let html = `
            <div class="mb-3">
                <h5 class="font-semibold text-white">${node.label}</h5>
                <div class="flex items-center mt-1">
                    <span class="equipment-status status-${node.status}"></span>
                    <span class="text-xs">${this.getStatusText(node.status)}</span>
                </div>
            </div>
            <div class="space-y-2 text-xs">
                <div><strong>타입:</strong> ${typeNames[node.type] || '기본'}</div>
                <div><strong>부서:</strong> ${node.department}</div>
                <div><strong>위치:</strong> ${node.location}</div>
                <div><strong>ID:</strong> ${node.id}</div>
            </div>
        `;
        
        // 연결된 노드 정보
        if (this.currentData && this.currentData.links) {
            const connectedNodes = this.currentData.links
                .filter(link => link.source.id === node.id || link.target.id === node.id)
                .map(link => ({
                    node: link.source.id === node.id ? link.target : link.source,
                    type: link.type
                }))
                .filter((item, index, self) => self.findIndex(i => i.node.id === item.node.id) === index);
            
            if (connectedNodes.length > 0) {
                html += `
                    <div class="mt-3 pt-3 border-t border-[#4A4A6A]">
                        <h6 class="font-medium text-white mb-2">연결된 설비 (${connectedNodes.length}개)</h6>
                        <div class="space-y-1 max-h-32 overflow-y-auto">
                `;
                connectedNodes.forEach(item => {
                    html += `
                        <div class="flex items-center text-xs">
                            <div class="w-2 h-2 rounded-full mr-2" style="background-color: ${this.getLinkColor(item.type)}"></div>
                            <span>${item.node.label || item.node.id}</span>
                        </div>
                    `;
                });
                html += '</div></div>';
            }
        }
        
        nodeInfo.innerHTML = html;
    }
    
    // 드래그 이벤트 핸들러
    dragstarted(event, d) {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    
    dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    
    dragended(event, d) {
        if (!event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
    
    // 컨트롤 업데이트 메서드
    updateNodeSize(value) {
        document.getElementById('node-size-value').textContent = value;
        if (this.simulation) {
            this.simulation.force('collision').radius(parseInt(value) + 5);
            this.g.selectAll('.node').attr('r', d => this.getNodeSize(d, parseInt(value)));
            this.simulation.alpha(0.3).restart();
        }
    }
    
    updateLinkDistance(value) {
        document.getElementById('link-distance-value').textContent = value;
        if (this.simulation) {
            this.simulation.force('link').distance(parseInt(value));
            this.simulation.alpha(0.3).restart();
        }
    }
    
    updateCharge(value) {
        document.getElementById('charge-value').textContent = value;
        if (this.simulation) {
            this.simulation.force('charge').strength(parseInt(value));
            this.simulation.alpha(0.3).restart();
        }
    }
    
    changeLayout(layout) {
        console.log('레이아웃 변경:', layout);
        
        if (!this.simulation || !this.currentData) return;
        
        // 기존 시뮬레이션 중지
        this.simulation.stop();
        
        const container = document.getElementById('network-container');
        const width = container.clientWidth;
        const height = container.clientHeight;
        const centerX = width / 2;
        const centerY = height / 2;
        
        switch(layout) {
            case 'force':
                this.applyForceDirectedLayout(width, height);
                break;
            case 'circular':
                this.applyCircularLayout(centerX, centerY);
                break;
            case 'hierarchical':
                this.applyHierarchicalLayout(width, height);
                break;
            case 'radial':
                this.applyRadialLayout(centerX, centerY);
                break;
            default:
                this.applyForceDirectedLayout(width, height);
        }
        
        this.showNotification(`${this.getLayoutDisplayName(layout)} 레이아웃이 적용되었습니다.`, 'info');
    }
    
    applyForceDirectedLayout(width, height) {
        // 포스 다이렉티드 레이아웃 (기본)
        this.simulation = d3.forceSimulation(this.currentData.nodes)
            .force('link', d3.forceLink(this.currentData.links).id(d => d.id).distance(120))
            .force('charge', d3.forceManyBody().strength(-180))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(25));
        
        this.simulation.on('tick', () => this.ticked());
        this.simulation.alpha(0.3).restart();
    }
    
    applyCircularLayout(centerX, centerY) {
        // 원형 배치 레이아웃
        const nodes = this.currentData.nodes;
        const radius = Math.min(centerX, centerY) * 0.7;
        
        nodes.forEach((node, i) => {
            const angle = (2 * Math.PI * i) / nodes.length;
            node.fx = centerX + radius * Math.cos(angle);
            node.fy = centerY + radius * Math.sin(angle);
        });
        
        // 고정 위치로 설정된 노드들을 부드럽게 이동
        this.simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(this.currentData.links).id(d => d.id).distance(50).strength(0.1))
            .force('collision', d3.forceCollide().radius(20))
            .alpha(0.1);
        
        this.simulation.on('tick', () => this.ticked());
        this.simulation.restart();
        
        // 3초 후 고정 해제 (드래그 가능하도록)
        setTimeout(() => {
            nodes.forEach(node => {
                node.fx = null;
                node.fy = null;
            });
        }, 3000);
    }
    
    applyHierarchicalLayout(width, height) {
        // 계층형 레이아웃
        const nodesByType = {};
        this.currentData.nodes.forEach(node => {
            if (!nodesByType[node.type]) {
                nodesByType[node.type] = [];
            }
            nodesByType[node.type].push(node);
        });
        
        const types = Object.keys(nodesByType);
        const levelHeight = height / (types.length + 1);
        
        types.forEach((type, typeIndex) => {
            const nodesInType = nodesByType[type];
            const nodeWidth = width / (nodesInType.length + 1);
            
            nodesInType.forEach((node, nodeIndex) => {
                node.fx = nodeWidth * (nodeIndex + 1);
                node.fy = levelHeight * (typeIndex + 1);
            });
        });
        
        this.simulation = d3.forceSimulation(this.currentData.nodes)
            .force('link', d3.forceLink(this.currentData.links).id(d => d.id).distance(80).strength(0.2))
            .force('collision', d3.forceCollide().radius(25))
            .alpha(0.1);
        
        this.simulation.on('tick', () => this.ticked());
        this.simulation.restart();
        
        // 3초 후 고정 해제
        setTimeout(() => {
            this.currentData.nodes.forEach(node => {
                node.fx = null;
                node.fy = null;
            });
        }, 3000);
    }
    
    applyRadialLayout(centerX, centerY) {
        // 방사형 레이아웃 (중요도 기반)
        const nodes = this.currentData.nodes;
        
        // 연결 수에 따라 중요도 계산
        const connectionCounts = {};
        nodes.forEach(node => connectionCounts[node.id] = 0);
        
        this.currentData.links.forEach(link => {
            connectionCounts[link.source.id || link.source]++;
            connectionCounts[link.target.id || link.target]++;
        });
        
        // 중요도 순으로 정렬
        const sortedNodes = nodes.slice().sort((a, b) => 
            connectionCounts[b.id] - connectionCounts[a.id]
        );
        
        // 중앙에 가장 중요한 노드 배치
        const mostImportant = sortedNodes[0];
        mostImportant.fx = centerX;
        mostImportant.fy = centerY;
        
        // 나머지 노드들을 동심원으로 배치
        const rings = 3; // 3개의 고리
        const nodesPerRing = Math.ceil((nodes.length - 1) / rings);
        
        for (let ring = 0; ring < rings; ring++) {
            const radius = (ring + 1) * 80;
            const startIndex = ring * nodesPerRing + 1;
            const endIndex = Math.min(startIndex + nodesPerRing, nodes.length);
            const nodesInRing = endIndex - startIndex;
            
            for (let i = startIndex; i < endIndex; i++) {
                const node = sortedNodes[i];
                const angle = (2 * Math.PI * (i - startIndex)) / nodesInRing;
                node.fx = centerX + radius * Math.cos(angle);
                node.fy = centerY + radius * Math.sin(angle);
            }
        }
        
        this.simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(this.currentData.links).id(d => d.id).distance(60).strength(0.3))
            .force('collision', d3.forceCollide().radius(20))
            .alpha(0.1);
        
        this.simulation.on('tick', () => this.ticked());
        this.simulation.restart();
        
        // 3초 후 고정 해제
        setTimeout(() => {
            nodes.forEach(node => {
                node.fx = null;
                node.fy = null;
            });
        }, 3000);
    }
    
    getLayoutDisplayName(layout) {
        const names = {
            'force': '포스 다이렉티드',
            'circular': '원형 배치',
            'hierarchical': '계층형',
            'radial': '방사형'
        };
        return names[layout] || layout;
    }
    
    applyFilters() {
        const activeFilters = [];
        document.querySelectorAll('.equipment-filter:checked').forEach(filter => {
            activeFilters.push(filter.dataset.type);
        });
        
        if (activeFilters.length === 0) {
            // 모든 필터가 해제된 경우 모든 노드 숨김
            this.g.selectAll('.node-group').style('display', 'none');
            this.g.selectAll('.link').style('display', 'none');
            return;
        }
        
        // 선택된 타입의 노드들과 연결된 모든 노드들을 찾기
        const primaryNodeIds = new Set();
        const connectedNodeIds = new Set();
        
        // 먼저 선택된 타입의 노드들을 추가
        this.currentData.nodes.forEach(node => {
            if (activeFilters.includes(node.type)) {
                primaryNodeIds.add(node.id);
            }
        });
        
        // 선택된 노드들과 연결된 노드들도 추가
        this.currentData.links.forEach(link => {
            if (primaryNodeIds.has(link.source.id)) {
                connectedNodeIds.add(link.target.id);
            } else if (primaryNodeIds.has(link.target.id)) {
                connectedNodeIds.add(link.source.id);
            }
        });
        
        // 모든 관련 노드들 합치기
        const allVisibleNodeIds = new Set([...primaryNodeIds, ...connectedNodeIds]);
        
        // 노드 표시/숨김 및 투명도 처리
        this.g.selectAll('.node-group').each(function(d) {
            const element = d3.select(this);
            if (allVisibleNodeIds.has(d.id)) {
                element.style('display', 'block');
                if (primaryNodeIds.has(d.id)) {
                    // 주요 선택된 노드는 완전히 보이게
                    element.style('opacity', 1);
                } else {
                    // 연결된 노드는 약간 흐리게
                    element.style('opacity', 0.7);
                }
            } else {
                // 관련 없는 노드는 완전히 숨김
                element.style('display', 'none');
            }
        });
        
        // 링크 표시/숨김 및 투명도 처리
        this.g.selectAll('.link').each(function(d) {
            const element = d3.select(this);
            if (allVisibleNodeIds.has(d.source.id) && allVisibleNodeIds.has(d.target.id)) {
                element.style('display', 'block');
                // 주요 노드와 연결된 링크는 더 강조
                if (primaryNodeIds.has(d.source.id) || primaryNodeIds.has(d.target.id)) {
                    element.style('opacity', 0.8);
                } else {
                    element.style('opacity', 0.5);
                }
            } else {
                element.style('display', 'none');
            }
        });
    }
    
    resetView() {
        document.getElementById('node-size').value = 8;
        document.getElementById('link-distance').value = 100;
        document.getElementById('charge').value = -200;
        this.updateNodeSize(8);
        this.updateLinkDistance(100);
        this.updateCharge(-200);
        
        if (this.zoom) {
            this.svg.transition().duration(750).call(
                this.zoom.transform,
                d3.zoomIdentity
            );
        }
    }
    
    applySettings() {
        if (this.currentData) {
            this.createNetworkVisualization(this.currentData);
        }
    }
    
    zoomIn() {
        this.svg.transition().call(this.zoom.scaleBy, 1.5);
    }
    
    zoomOut() {
        this.svg.transition().call(this.zoom.scaleBy, 1 / 1.5);
    }
    
    fitToView() {
        const bounds = this.g.node().getBBox();
        const parent = this.g.node().parentElement;
        const fullWidth = parent.clientWidth || parent.parentNode.clientWidth;
        const fullHeight = parent.clientHeight || parent.parentNode.clientHeight;
        const width = bounds.width;
        const height = bounds.height;
        const midX = bounds.x + width / 2;
        const midY = bounds.y + height / 2;
        
        if (width == 0 || height == 0) return;
        
        const scale = 0.85 / Math.max(width / fullWidth, height / fullHeight);
        const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];
        
        this.svg.transition().duration(750).call(
            this.zoom.transform,
            d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
        );
    }
    
    // 실시간 업데이트
    startRealTimeUpdates() {
        this.realTimeInterval = setInterval(() => {
            this.simulateRealTimeData();
        }, 30000); // 30초마다 업데이트 (더 현실적인 간격)
    }
    
    stopRealTimeUpdates() {
        if (this.realTimeInterval) {
            clearInterval(this.realTimeInterval);
        }
    }
    
    simulateRealTimeData() {
        if (!this.isRealTimeMode || !this.currentData) return;
        
        // 현재 상태 분포 계산
        const currentStatus = {
            normal: 0,
            warning: 0,
            critical: 0,
            maintenance: 0
        };
        
        this.currentData.nodes.forEach(node => {
            currentStatus[node.status]++;
        });
        
        const totalNodes = this.currentData.nodes.length;
        
        // 더 현실적인 상태 변경 로직
        this.currentData.nodes.forEach(node => {
            const random = Math.random();
            
            // 상태 변경 확률을 낮춤 (3% 확률)
            if (random < 0.03) {
                const currentNodeStatus = node.status;
                
                // 현재 상태에 따른 가중치 적용
                if (currentNodeStatus === 'normal') {
                    // 정상 상태에서는 주의로 변경될 가능성이 높고, 위험으로는 매우 낮음
                    const changeRandom = Math.random();
                    if (changeRandom < 0.7) {
                        node.status = 'warning'; // 70% 확률로 주의
                    } else if (changeRandom < 0.75) {
                        node.status = 'critical'; // 5% 확률로 위험
                    }
                    // 25% 확률로 정상 유지
                } else if (currentNodeStatus === 'warning') {
                    // 주의 상태에서는 정상으로 돌아갈 확률이 높음
                    const changeRandom = Math.random();
                    if (changeRandom < 0.6) {
                        node.status = 'normal'; // 60% 확률로 정상 복구
                    } else if (changeRandom < 0.7) {
                        node.status = 'critical'; // 10% 확률로 위험
                    }
                    // 30% 확률로 주의 유지
                } else if (currentNodeStatus === 'critical') {
                    // 위험 상태에서는 빠르게 정상이나 주의로 복구
                    const changeRandom = Math.random();
                    if (changeRandom < 0.4) {
                        node.status = 'warning'; // 40% 확률로 주의
                    } else if (changeRandom < 0.7) {
                        node.status = 'normal'; // 30% 확률로 정상 복구
                    }
                    // 30% 확률로 위험 유지
                }
                
                // 전체적인 위험 상태 비율 제한 (최대 10%)
                const criticalCount = this.currentData.nodes.filter(n => n.status === 'critical').length;
                const criticalRatio = criticalCount / totalNodes;
                
                if (node.status === 'critical' && criticalRatio > 0.1) {
                    // 위험 비율이 10%를 초과하면 주의로 변경
                    node.status = 'warning';
                }
                
                // 전체적인 주의 상태 비율 제한 (최대 25%)
                const warningCount = this.currentData.nodes.filter(n => n.status === 'warning').length;
                const warningRatio = warningCount / totalNodes;
                
                if (node.status === 'warning' && warningRatio > 0.25) {
                    // 주의 비율이 25%를 초과하면 정상으로 변경
                    node.status = 'normal';
                }
            }
        });
        
        // 노드 색상 업데이트
        this.g.selectAll('.node')
            .attr('stroke', d => this.statusColors[d.status]);
        
        this.g.selectAll('.status-indicator')
            .attr('fill', d => this.statusColors[d.status]);
        
        this.updateStats();
        
        // 상태 변경 알림 (선택적)
        const newStatus = {
            normal: 0,
            warning: 0,
            critical: 0,
            maintenance: 0
        };
        
        this.currentData.nodes.forEach(node => {
            newStatus[node.status]++;
        });
        
        // 위험 상태가 증가했을 때만 알림
        if (newStatus.critical > currentStatus.critical) {
            this.showNotification(`위험 상태 설비가 ${newStatus.critical - currentStatus.critical}개 증가했습니다.`, 'warning');
        }
    }
    
    updateStats() {
        if (!this.currentData) return;
        
        const statusCounts = {
            normal: 0,
            warning: 0,
            critical: 0,
            maintenance: 0
        };
        
        this.currentData.nodes.forEach(node => {
            statusCounts[node.status]++;
        });
        
        document.getElementById('stats').textContent = 
            `노드 ${this.currentData.nodes.length}개 | 연결 ${this.currentData.links.length}개 | 활성 설비 ${statusCounts.normal + statusCounts.warning}개`;
        
        // 하단 상태 표시 업데이트
        this.updateBottomStatusDisplay(statusCounts);
        
        // 사이드바 하단 통계 업데이트
        this.updateSidebarStats();
    }
    
    updateSidebarStats() {
        if (!this.currentData) return;
        
        const statusCounts = {
            normal: 0,
            warning: 0,
            critical: 0,
            maintenance: 0
        };
        
        this.currentData.nodes.forEach(node => {
            statusCounts[node.status]++;
        });
        
        const totalEquipment = this.currentData.nodes.length;
        const normalEquipment = statusCounts.normal;
        
        const sidebarStats = document.getElementById('sidebar-stats');
        if (sidebarStats) {
            sidebarStats.innerHTML = `
                <span class="text-green-400">${totalEquipment}</span>개 설비 | 
                <span class="text-blue-400">${normalEquipment}</span>개 정상
            `;
        }
    }
    
    updateBottomStatusDisplay(statusCounts) {
        const bottomStatusDisplay = document.getElementById('bottom-status-display');
        if (bottomStatusDisplay) {
            bottomStatusDisplay.innerHTML = `
                <div class="flex items-center space-x-3 text-sm font-medium">
                <span class="equipment-status status-normal"></span>
                    <span class="text-green-400">정상: ${statusCounts.normal}</span>
                <span class="equipment-status status-warning"></span>
                    <span class="text-yellow-400">주의: ${statusCounts.warning}</span>
                <span class="equipment-status status-critical"></span>
                    <span class="text-red-400">위험: ${statusCounts.critical}</span>
                </div>
            `;
        }
    }
    
    // 기타 유틸리티 메서드
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const toggleBtn = document.getElementById('toggle-sidebar');
        
        if (sidebar.classList.contains('w-64')) {
            sidebar.classList.remove('w-64');
            sidebar.classList.add('w-16');
            toggleBtn.innerHTML = '<i class="ri-arrow-right-s-line"></i>';
        } else {
            sidebar.classList.remove('w-16');
            sidebar.classList.add('w-64');
            toggleBtn.innerHTML = '<i class="ri-arrow-left-s-line"></i>';
        }
        
        // SVG 크기 재조정
        setTimeout(() => {
            if (this.svg) {
                const container = document.getElementById('network-container');
                this.svg.attr('width', container.clientWidth)
                        .attr('height', container.clientHeight);
                if (this.simulation) {
                    this.simulation.force('center', d3.forceCenter(container.clientWidth / 2, container.clientHeight / 2));
                    this.simulation.alpha(0.3).restart();
                }
            }
        }, 300);
    }
    
    searchEquipment(query) {
        if (!query.trim()) {
            this.g.selectAll('.node-group').style('opacity', 1);
            return;
        }
        
        this.g.selectAll('.node-group').style('opacity', d => {
            return d.label.toLowerCase().includes(query.toLowerCase()) ||
                   d.department.toLowerCase().includes(query.toLowerCase()) ||
                   d.location.toLowerCase().includes(query.toLowerCase()) ? 1 : 0.3;
        });
    }
    
    setFilter(filter) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active', 'bg-gradient-to-r', 'from-primary', 'to-accent');
            btn.classList.add('bg-slate-600', 'text-slate-300');
        });
        
        const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
        activeBtn.classList.add('active', 'bg-gradient-to-r', 'from-primary', 'to-accent', 'text-white');
        activeBtn.classList.remove('bg-slate-600', 'text-slate-300');
        
        if (filter === 'all') {
            // 모든 노드와 링크를 표시하고 투명도 복원
            this.g.selectAll('.node-group')
                .style('display', 'block')
                .style('opacity', 1);
            this.g.selectAll('.link')
                .style('display', 'block')
                .style('opacity', 0.6);
        } else {
            // 선택된 타입의 노드들과 연결된 모든 노드들을 찾기
            const primaryNodeIds = new Set(); // 주요 선택된 노드들
            const connectedNodeIds = new Set(); // 연결된 노드들
            
            // 먼저 선택된 타입의 노드들을 추가
            this.currentData.nodes.forEach(node => {
                if (node.type === filter) {
                    primaryNodeIds.add(node.id);
                }
            });
            
            // 선택된 노드들과 연결된 노드들도 추가
            this.currentData.links.forEach(link => {
                if (primaryNodeIds.has(link.source.id)) {
                    connectedNodeIds.add(link.target.id);
                } else if (primaryNodeIds.has(link.target.id)) {
                    connectedNodeIds.add(link.source.id);
                }
            });
            
            // 모든 관련 노드들 합치기
            const allVisibleNodeIds = new Set([...primaryNodeIds, ...connectedNodeIds]);
            
            // 노드 표시/숨김 및 투명도 처리
            this.g.selectAll('.node-group').each(function(d) {
                const element = d3.select(this);
                if (allVisibleNodeIds.has(d.id)) {
                    element.style('display', 'block');
                    if (primaryNodeIds.has(d.id)) {
                        // 주요 선택된 노드는 완전히 보이게
                        element.style('opacity', 1);
                    } else {
                        // 연결된 노드는 약간 흐리게
                        element.style('opacity', 0.7);
                    }
                } else {
                    // 관련 없는 노드는 완전히 숨김
                    element.style('display', 'none');
                }
            });
            
            // 링크 표시/숨김 및 투명도 처리
            this.g.selectAll('.link').each(function(d) {
                const element = d3.select(this);
                if (allVisibleNodeIds.has(d.source.id) && allVisibleNodeIds.has(d.target.id)) {
                    element.style('display', 'block');
                    // 주요 노드와 연결된 링크는 더 강조
                    if (primaryNodeIds.has(d.source.id) || primaryNodeIds.has(d.target.id)) {
                        element.style('opacity', 0.8);
                    } else {
                        element.style('opacity', 0.5);
                    }
                } else {
                    element.style('display', 'none');
                }
            });
            
            // 필터 적용 후 뷰를 적절히 조정
            setTimeout(() => {
                this.fitToView();
            }, 300);
        }
        
        // 필터 적용 후 통계 업데이트
        this.updateFilteredStats(filter);
    }
    
    updateFilteredStats(filter) {
        if (!this.currentData) return;
        
        let visibleNodes = this.currentData.nodes;
        let visibleLinks = this.currentData.links;
        
        if (filter !== 'all') {
            // 선택된 타입의 노드들과 연결된 노드들 계산
            const primaryNodeIds = new Set();
            const connectedNodeIds = new Set();
            
            this.currentData.nodes.forEach(node => {
                if (node.type === filter) {
                    primaryNodeIds.add(node.id);
                }
            });
            
            this.currentData.links.forEach(link => {
                if (primaryNodeIds.has(link.source.id)) {
                    connectedNodeIds.add(link.target.id);
                } else if (primaryNodeIds.has(link.target.id)) {
                    connectedNodeIds.add(link.source.id);
                }
            });
            
            const allVisibleNodeIds = new Set([...primaryNodeIds, ...connectedNodeIds]);
            
            visibleNodes = this.currentData.nodes.filter(node => allVisibleNodeIds.has(node.id));
            visibleLinks = this.currentData.links.filter(link => 
                allVisibleNodeIds.has(link.source.id) && allVisibleNodeIds.has(link.target.id)
            );
        }
        
        const statusCounts = {
            normal: 0,
            warning: 0,
            critical: 0,
            maintenance: 0
        };
        
        visibleNodes.forEach(node => {
            statusCounts[node.status]++;
        });
        
        // 통계 업데이트
        const filterName = filter === 'all' ? '전체' : this.getTypeDisplayName(filter);
        document.getElementById('stats').textContent = 
            `${filterName} 설비 ${visibleNodes.length}개 | 연결 ${visibleLinks.length}개 | 활성 설비 ${statusCounts.normal + statusCounts.warning}개`;
        
        // 사이드바 하단 통계도 필터링된 데이터로 업데이트
        const sidebarStats = document.getElementById('sidebar-stats');
        if (sidebarStats) {
            sidebarStats.innerHTML = `
                <span class="text-green-400">${visibleNodes.length}</span>개 설비 | 
                <span class="text-blue-400">${statusCounts.normal}</span>개 정상
            `;
        }
        
        // 하단 상태 표시도 필터링된 데이터로 업데이트
        this.updateBottomStatusDisplay(statusCounts);
    }
    
    getTypeDisplayName(type) {
        const typeNames = {
            'production': '생산설비',
            'utility': '유틸리티',
            'safety': '안전시스템',
            'quality': '품질관리',
            'maintenance': '정비시스템'
        };
        return typeNames[type] || type;
    }
    
    exportData() {
        if (!this.currentData) return;
        
        const dataStr = JSON.stringify(this.currentData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `NEXUS_equipment_network_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }
    
    handleFileUpload(event) {
        const files = event.target.files;
        if (files.length === 0) return;
        
        document.getElementById('loading').classList.remove('hidden');
        
        // 파일 처리 로직 (실제 구현에서는 서버로 전송)
        setTimeout(() => {
            document.getElementById('loading').classList.add('hidden');
            console.log(`${files.length}개 파일이 업로드되었습니다.`);
        }, 2000);
    }
    
    // 파일 업로드 기능 개선
    handleFileUpload(event) {
        const files = event.target.files;
        if (files.length === 0) return;
        
        document.getElementById('loading').classList.remove('hidden');
        
        // 파일 타입별 처리
        Array.from(files).forEach(file => {
            const fileType = file.name.split('.').pop().toLowerCase();
            
            switch (fileType) {
                case 'md':
                case 'txt':
                    this.processTextFile(file);
                    break;
                case 'json':
                    this.processJsonFile(file);
                    break;
                case 'csv':
                    this.processCsvFile(file);
                    break;
                case 'xlsx':
                    this.processExcelFile(file);
                    break;
                default:
                    this.showNotification(`지원되지 않는 파일 형식입니다: ${fileType}`, 'warning');
            }
        });
        
        setTimeout(() => {
            document.getElementById('loading').classList.add('hidden');
            this.showNotification(`${files.length}개 파일이 성공적으로 처리되었습니다.`, 'success');
            
            // 파일 입력 초기화
            event.target.value = '';
        }, 2000);
    }
    
    processTextFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            console.log('텍스트 파일 내용:', content);
            // 마크다운 파싱 로직 (필요시 구현)
            this.parseMarkdownContent(content);
        };
        reader.readAsText(file);
    }
    
    processJsonFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                console.log('JSON 데이터:', jsonData);
                
                // JSON 데이터 구조 검증 후 적용
                if (jsonData.nodes && jsonData.links) {
                    this.currentData = jsonData;
                    this.createNetworkVisualization(jsonData);
                    this.updateStats();
                    this.showNotification('JSON 데이터가 성공적으로 로드되었습니다.', 'success');
                } else {
                    this.showNotification('JSON 파일 구조가 올바르지 않습니다. nodes와 links 배열이 필요합니다.', 'warning');
                }
            } catch (error) {
                this.showNotification('유효하지 않은 JSON 파일입니다.', 'error');
            }
        };
        reader.readAsText(file);
    }
    
    processCsvFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const csvContent = e.target.result;
            console.log('CSV 파일 내용:', csvContent);
            // CSV 파싱 로직
            this.parseCsvContent(csvContent);
        };
        reader.readAsText(file);
    }
    
    processExcelFile(file) {
        // Excel 파일 처리 (필요시 SheetJS 라이브러리 사용)
        console.log('Excel 파일 처리:', file.name);
        this.showNotification('Excel 파일 처리 기능은 추후 구현될 예정입니다.', 'info');
    }
    
    parseMarkdownContent(content) {
        // 간단한 마크다운 파싱 (실제로는 더 정교한 파싱 필요)
        console.log('마크다운 파싱:', content.substring(0, 100) + '...');
        this.showNotification('마크다운 파일 파싱 기능은 추후 구현될 예정입니다.', 'info');
    }
    
    parseCsvContent(csvContent) {
        // 간단한 CSV 파싱
        const lines = csvContent.split('\n');
        const headers = lines[0].split(',');
        console.log('CSV 헤더:', headers);
        
        // CSV에서 설비 데이터 추출 (예시)
        const nodes = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length >= 3) {
                nodes.push({
                    id: values[0],
                    label: values[1],
                    type: values[2] || 'production',
                    status: values[3] || 'normal'
                });
            }
        }
        
        if (nodes.length > 0) {
            // 새로운 데이터 생성
            const newData = {
                nodes: nodes,
                links: [] // 링크는 별도로 정의 필요
            };
            
            this.currentData = newData;
            this.createNetworkVisualization(newData);
            this.updateStats();
            this.showNotification(`CSV에서 ${nodes.length}개 설비를 가져왔습니다.`, 'success');
        } else {
            this.showNotification('CSV 파일에서 유효한 설비 데이터를 찾을 수 없습니다.', 'warning');
        }
    }
    
    initializeDropdowns() {
        // 프로필 드롭다운 기능 비활성화됨
        // 필요시 여기에 다른 드롭다운 초기화 코드 추가
    }
    
    showNodeDetailModal(node) {
        const modal = document.getElementById('node-detail-modal');
        const content = document.getElementById('node-detail-content');
        
        // 연결된 노드들 분석
        const connections = this.analyzeNodeConnections(node);
        const insights = this.generateNodeInsights(node, connections);
        
        content.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- 기본 정보 -->
                <div class="card p-4">
                    <h4 class="font-bold text-white mb-4 flex items-center">
                        <i class="ri-information-line mr-2 text-primary"></i>
                        기본 정보
                    </h4>
                    <div class="space-y-3 text-sm">
                        <div class="flex justify-between">
                            <span class="text-slate-400">설비명:</span>
                            <span class="font-medium text-white">${node.label}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-slate-400">설비 ID:</span>
                            <span class="font-mono text-primary">${node.id}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-slate-400">타입:</span>
                            <span class="font-medium">${this.getTypeDisplayName(node.type)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-slate-400">상태:</span>
                            <span class="flex items-center">
                                <span class="equipment-status status-${node.status} mr-2"></span>
                                ${this.getStatusText(node.status)}
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-slate-400">담당 부서:</span>
                            <span class="font-medium">${node.department}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-slate-400">위치:</span>
                            <span class="font-medium">${node.location}</span>
                        </div>
                    </div>
                </div>
                
                <!-- 기술 사양 -->
                <div class="card p-4">
                    <h4 class="font-bold text-white mb-4 flex items-center">
                        <i class="ri-settings-3-line mr-2 text-accent"></i>
                        기술 사양
                    </h4>
                    <div class="space-y-3 text-sm">
                        ${this.generateTechnicalSpecs(node)}
                    </div>
                </div>
                
                <!-- 연결 관계 -->
                <div class="card p-4">
                    <h4 class="font-bold text-white mb-4 flex items-center">
                        <i class="ri-links-line mr-2 text-success"></i>
                        연결 관계 (${connections.length}개)
                    </h4>
                    <div class="space-y-2 max-h-40 overflow-y-auto">
                        ${connections.map(conn => `
                            <div class="flex items-center justify-between p-2 bg-slate-700/30 rounded text-xs">
                                <span class="font-medium">${conn.node.label}</span>
                                <span class="px-2 py-1 rounded text-xs" style="background-color: ${this.getLinkColor(conn.type)}20; color: ${this.getLinkColor(conn.type)}">
                                    ${conn.flow || conn.type}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- 인사이트 및 분석 -->
                <div class="card p-4">
                    <h4 class="font-bold text-white mb-4 flex items-center">
                        <i class="ri-lightbulb-line mr-2 text-warning"></i>
                        AI 인사이트
                    </h4>
                    <div class="space-y-3 text-sm">
                        ${insights.map(insight => `
                            <div class="flex items-start space-x-3">
                                <div class="w-2 h-2 rounded-full bg-${insight.type === 'warning' ? 'yellow' : insight.type === 'critical' ? 'red' : 'blue'}-400 mt-2 flex-shrink-0"></div>
                                <span class="text-slate-300">${insight.message}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <!-- 성능 차트 영역 -->
            <div class="mt-6 card p-4">
                <h4 class="font-bold text-white mb-4 flex items-center">
                    <i class="ri-bar-chart-line mr-2 text-primary"></i>
                    실시간 성능 모니터링
                </h4>
                <div class="grid grid-cols-3 gap-4">
                    ${this.generatePerformanceMetrics(node)}
                </div>
            </div>
        `;
        
        this.showModal('node-detail-modal');
    }
    
    analyzeNodeConnections(node) {
        if (!this.currentData || !this.currentData.links) return [];
        
        return this.currentData.links
            .filter(link => link.source.id === node.id || link.target.id === node.id)
            .map(link => ({
                node: link.source.id === node.id ? link.target : link.source,
                type: link.type,
                flow: link.flow,
                strength: link.strength
            }));
    }
    
    generateNodeInsights(node, connections) {
        const insights = [];
        
        // 연결된 설비들 분석
        const connectedNodes = connections.map(conn => conn.node);
        const connectedByType = this.groupNodesByType(connectedNodes);
        
        // 상태 기반 실무 인사이트
        if (node.status === 'warning') {
            insights.push(...this.generateWarningInsights(node, connectedNodes));
        } else if (node.status === 'critical') {
            insights.push(...this.generateCriticalInsights(node, connectedNodes));
        } else if (node.status === 'maintenance') {
            insights.push(...this.generateMaintenanceInsights(node, connectedNodes));
        }
        
        // 설비별 특화 실무 인사이트
        insights.push(...this.generateEquipmentSpecificInsights(node, connectedNodes));
        
        // 연결성 기반 영향도 분석
        insights.push(...this.generateConnectivityInsights(node, connections, connectedByType));
        
        // 예측 정비 및 최적화 제안
        insights.push(...this.generatePredictiveInsights(node, connectedNodes));
        
        // 기본 인사이트 (최소 1개는 보장)
        if (insights.length === 0) {
            insights.push({
                type: 'info',
                message: `${node.label}은 현재 정상 운영 중입니다. 정기 점검 일정을 확인하시기 바랍니다.`
            });
        }
        
        return insights.slice(0, 5); // 최대 5개로 제한
    }
    
    groupNodesByType(nodes) {
        return nodes.reduce((acc, node) => {
            if (!acc[node.type]) acc[node.type] = [];
            acc[node.type].push(node);
            return acc;
        }, {});
    }
    
    generateWarningInsights(node, connectedNodes) {
        const insights = [];
        
        switch (node.id) {
            case 'EXT-2847': // 압출기 경고
            insights.push({
                type: 'warning',
                    message: '압출기 온도 변동이 감지되었습니다. 중앙냉각시스템(COOL-SYS-8901) 냉각수 온도와 압력을 확인하세요.'
                });
                insights.push({
                    type: 'action',
                    message: '권장 조치: 1) 냉각수 유량 확인 2) 히터 상태 점검 3) 온도센서 교정 4) 스크류 마모도 검사'
                });
                break;
                
            case 'BOILER-9876': // 보일러 경고
                insights.push({
                    type: 'warning',
                    message: '스팀보일러 압력 변동이 감지되었습니다. 안전밸브시스템(SAFETY-VALVE-5566) 작동 상태를 즉시 확인하세요.'
                });
                insights.push({
                    type: 'action',
                    message: '권장 조치: 1) 안전밸브 설정압력 확인 2) 압력게이지 교정 3) 급수펌프 상태 점검 4) 연소상태 확인'
                });
                break;
                
            case 'VENTILATION-7788': // 환기시스템 경고
                insights.push({
                    type: 'warning',
                    message: '환기시스템 필터 교체가 필요합니다. 용접기(WELD-4567) 작업 시 환기 효율 저하로 작업환경 악화 우려'
                });
                insights.push({
                    type: 'action',
                    message: '권장 조치: 1) HEPA 필터 교체 2) 팬 벨트 장력 확인 3) 덕트 청소 4) 가스감지기 민감도 재설정'
                });
                break;
                
            case 'WEIGHT-CHECK-3355': // 중량검사기 경고
                insights.push({
                    type: 'warning',
                    message: '중량검사기 교정이 필요합니다. 절단기(CUT-7890)에서 생산되는 제품의 품질 검증에 영향을 줄 수 있습니다.'
                });
                insights.push({
                    type: 'action',
                    message: '권장 조치: 1) 표준분동으로 교정 2) 로드셀 점검 3) 진동 영향 확인 4) 컨베이어 수평도 조정'
                });
                break;
                
            default:
                insights.push({
                    type: 'warning',
                    message: `${node.label}에서 이상 신호가 감지되었습니다. 연결된 ${connectedNodes.length}개 설비에 영향을 줄 수 있으니 즉시 점검하세요.`
                });
        }
        
        return insights;
    }
    
    generateCriticalInsights(node, connectedNodes) {
        const insights = [];
        
        switch (node.id) {
            case 'CONV-B2-1456': // 컨베이어 위험상태
            insights.push({
                type: 'critical',
                    message: '컨베이어 벨트 파손 위험! 압출기(EXT-2847)→절단기(CUT-7890) 생산라인 전체 중단 가능성'
                });
                insights.push({
                    type: 'emergency',
                    message: '긴급 조치: 1) 즉시 라인 정지 2) 벨트 장력 확인 3) 구동모터 과부하 점검 4) 비상정지시스템 테스트'
                });
                insights.push({
                    type: 'impact',
                    message: '영향 범위: LINE-A 전체 생산 중단, 일일 생산목표 200kg/h 달성 불가, 후공정 포장라인 대기'
                });
                break;
                
            default:
                insights.push({
                    type: 'critical',
                    message: `${node.label} 위험 상태! 연결된 설비들의 연쇄 정지를 방지하기 위해 즉시 격리 조치가 필요합니다.`
                });
        }
        
        return insights;
    }
    
    generateMaintenanceInsights(node, connectedNodes) {
        const insights = [];
        
        switch (node.id) {
            case 'WELD-4567': // 용접기 정비
            insights.push({
                    type: 'maintenance',
                    message: '용접기 정기정비 중입니다. 정비도구시스템(MAINT-TOOL-4466)에서 토크렌치, 절연저항계 대출 확인'
                });
                insights.push({
                    type: 'schedule',
                    message: '정비 일정: 1) 전극 교체 (2시간) 2) 냉각수 교체 (1시간) 3) 절연저항 측정 (30분) 4) 시운전 (1시간)'
                });
                insights.push({
                    type: 'impact',
                    message: '정비 영향: LINE-C 용접공정 4시간 중단, 환기시스템 부하 감소, 가스감지기 일시 비활성화'
                });
                break;
                
            default:
                insights.push({
                    type: 'maintenance',
                    message: `${node.label} 계획정비가 진행 중입니다. 연결된 설비들의 운전 조건을 재조정하세요.`
                });
        }
        
        return insights;
    }
    
    generateEquipmentSpecificInsights(node, connectedNodes) {
        const insights = [];
        
        switch (node.type) {
            case 'production':
                if (node.id === 'EXT-2847') {
                    insights.push({
                        type: 'optimization',
                        message: '압출기 에너지 효율 92%로 양호합니다. 스크류 속도 120rpm 유지 시 품질센서(QC-SENSOR-9900) 데이터 기준 불량률 0.3% 달성'
                    });
                } else if (node.id === 'MIX-1456') {
                    insights.push({
                        type: 'quality',
                        message: '혼합기 배치시간 8분으로 최적화되었습니다. 압축공기 공급(COMP-AIR-2345) 안정적이며 혼합 균일도 99.5% 달성'
                    });
                }
                break;
                
            case 'utility':
                if (node.id === 'ELEC-MAIN-5432') {
                    insights.push({
                        type: 'efficiency',
                        message: '주배전반 부하율 75%로 적정 수준입니다. 압출기, 혼합기, 용접기 동시 운전 시에도 여유 용량 500kVA 확보'
                    });
                } else if (node.id === 'COOL-SYS-8901') {
                    insights.push({
                        type: 'performance',
                        message: '냉각시스템 효율 95%로 우수합니다. 압출기 냉각 시 15-25°C 범위 유지, 용접기 냉각 부하 증가 시 자동 제어 작동'
                    });
                }
                break;
                
            case 'safety':
                if (node.id === 'FIRE-DETECT-1122') {
                    insights.push({
                        type: 'safety',
                        message: '화재감지시스템 247개 센서 모두 정상 작동 중입니다. 압출기, 포장기 구역 열감지기 민감도 최적화 완료'
                    });
                } else if (node.id === 'GAS-DETECT-3344') {
                    insights.push({
                        type: 'safety',
                        message: '가스감지기 35개 센서 정상 작동 중입니다. 용접기 작업 시 CO 농도 5ppm 수준으로 안전 기준 이내 유지'
                    });
                }
                break;
                
            case 'quality':
                if (node.id === 'QC-SENSOR-9900') {
                    insights.push({
                        type: 'quality',
                        message: '품질센서 정확도 ±0.1%로 우수합니다. 압출기 제품 두께 변동 0.025μm 이내로 관리되고 있으며, 실시간 SPC 관리 활성화'
                    });
                } else if (node.id === 'INSPECT-AUTO-1133') {
                    insights.push({
                        type: 'quality',
                        message: '자동검사장비 처리량 200개/h, 정확도 99.8% 달성 중입니다. 포장기 연동으로 불량품 자동 배출 시스템 정상 작동'
                    });
                }
                break;
                
            case 'maintenance':
                if (node.id === 'DIAGNOSTIC-7799') {
                    insights.push({
                        type: 'predictive',
                        message: '진단장비 AI 분석 결과: 압출기 베어링 온도 상승 트렌드 감지, 2주 후 교체 권장. 보일러 진동 패턴 정상 범위 내'
                    });
                } else if (node.id === 'SPARE-PARTS-5577') {
                    insights.push({
                        type: 'inventory',
                        message: '예비부품 재고율 85%로 적정 수준입니다. 압출기 스크류, 용접기 전극 등 주요 부품 충분 보유, 자동 재주문 시스템 활성화'
                    });
                }
                break;
        }
        
        return insights;
    }
    
    generateConnectivityInsights(node, connections, connectedByType) {
        const insights = [];
        
        if (connections.length > 6) {
            const criticalConnections = connections.filter(conn => conn.strength === 'high').length;
            insights.push({
                type: 'network',
                message: `네트워크 허브 설비입니다. ${connections.length}개 연결 중 ${criticalConnections}개가 핵심 연결입니다. 이 설비 중단 시 전체 생산라인 영향도 높음`
            });
        }
        
        // 타입별 연결 분석
        if (connectedByType.production && connectedByType.production.length > 2) {
            insights.push({
                type: 'production_flow',
                message: `생산라인 핵심 설비입니다. ${connectedByType.production.length}개 생산설비와 연결되어 있어 공정 흐름에 직접적인 영향을 미칩니다.`
            });
        }
        
        if (connectedByType.safety && connectedByType.safety.length > 1) {
            insights.push({
                type: 'safety_critical',
                message: `안전 중요 설비입니다. ${connectedByType.safety.length}개 안전시스템이 모니터링하고 있으며, 비상 시 자동 정지 시스템 연동됩니다.`
            });
        }
        
        return insights;
    }
    
    generatePredictiveInsights(node, connectedNodes) {
        const insights = [];
        
        // 시뮬레이션된 예측 데이터 기반 인사이트
        const currentHour = new Date().getHours();
        const dayOfWeek = new Date().getDay();
        
        if (node.type === 'production') {
            if (currentHour >= 14 && currentHour <= 16) { // 오후 피크시간
            insights.push({
                    type: 'prediction',
                    message: '오후 피크시간 진입: 전력 부하 증가 예상, 냉각시스템 가동률 상승 예측. 주배전반 부하 모니터링 강화 권장'
            });
            }
            
            if (dayOfWeek === 5) { // 금요일
            insights.push({
                    type: 'maintenance_plan',
                    message: '주말 정비 계획: 진동 센서 데이터 기반으로 베어링 교체, 필터 청소 등 예방정비 수행 예정. 정비도구 사전 준비 필요'
            });
            }
        }
        
        if (node.type === 'utility' && node.id === 'BOILER-9876') {
            insights.push({
                type: 'energy_optimization',
                message: '에너지 최적화 제안: 현재 부하 패턴 분석 결과, 가동시간 조정으로 월 15% 에너지 절약 가능. 스팀 사용량 패턴 최적화 권장'
            });
        }
        
        return insights;
    }
    
    generateTechnicalSpecs(node) {
        const specs = [];
        
        // 노드의 기술 사양 속성들만 표시 (D3.js 내부 속성 제외)
        const excludedKeys = ['id', 'label', 'type', 'status', 'department', 'location', 
                              'x', 'y', 'vx', 'vy', 'fx', 'fy', 'index'];
        Object.keys(node).forEach(key => {
            if (excludedKeys.includes(key)) return;
            
            const value = node[key];
            const displayKey = this.getSpecDisplayName(key);
            specs.push(`
                <div class="flex justify-between py-1">
                    <span class="text-slate-400">${displayKey}:</span>
                    <span class="font-medium text-accent">${value}</span>
                </div>
            `);
        });
        
        // 항상 기본 기술 사양을 추가 (기존 속성이 있어도 보완)
        const defaultSpecs = this.getDefaultTechnicalSpecs(node.type, node.id);
        defaultSpecs.forEach(spec => {
            specs.push(`
                <div class="flex justify-between py-1">
                    <span class="text-slate-400">${spec.name}:</span>
                    <span class="font-medium text-accent">${spec.value}</span>
                </div>
            `);
        });
        
        return specs.length > 0 ? specs.join('') : '<span class="text-slate-400">기술 사양 정보가 없습니다.</span>';
    }
    
    getDefaultTechnicalSpecs(type, equipmentId) {
        const specs = [];
        
        switch(type) {
            case 'production':
                if (equipmentId.includes('EXT')) {
                    specs.push(
                        { name: '가공 온도', value: '180-220°C' },
                        { name: '압출 압력', value: '150-200 bar' },
                        { name: '스크류 직경', value: 'Ø65mm' },
                        { name: '생산 속도', value: '15-25 m/min' },
                        { name: '모터 출력', value: '45kW' },
                        { name: '제어 시스템', value: 'PLC + HMI' }
                    );
                } else if (equipmentId.includes('MIX')) {
                    specs.push(
                        { name: '혼합 용량', value: '500L' },
                        { name: '회전 속도', value: '30-120 RPM' },
                        { name: '혼합 시간', value: '15-30분' },
                        { name: '온도 제어', value: '±2°C' },
                        { name: '모터 출력', value: '22kW' },
                        { name: '재질', value: 'SUS304' }
                    );
                } else if (equipmentId.includes('CONV')) {
                    specs.push(
                        { name: '벨트 폭', value: '800mm' },
                        { name: '이송 속도', value: '0.5-5.0 m/min' },
                        { name: '최대 하중', value: '500kg/m' },
                        { name: '벨트 재질', value: 'PVC' },
                        { name: '구동 모터', value: '5.5kW' },
                        { name: '안전 장치', value: '비상정지, 과부하 보호' }
                    );
                } else if (equipmentId.includes('PKG')) {
                    specs.push(
                        { name: '포장 속도', value: '120 개/분' },
                        { name: '포장 크기', value: '100-500mm' },
                        { name: '필름 폭', value: '200-400mm' },
                        { name: '열봉인 온도', value: '120-180°C' },
                        { name: '압축 공기', value: '6 bar' },
                        { name: '제어 방식', value: '서보 모터' }
                    );
                } else if (equipmentId.includes('CUT')) {
                    specs.push(
                        { name: '절단 길이', value: '10-2000mm' },
                        { name: '절단 정밀도', value: '±0.5mm' },
                        { name: '블레이드 타입', value: '초경 합금' },
                        { name: '절단 속도', value: '80 cuts/분' },
                        { name: '모터 출력', value: '15kW' },
                        { name: '냉각 방식', value: '공냉식' }
                    );
                } else if (equipmentId.includes('WELD')) {
                    specs.push(
                        { name: '용접 전류', value: '50-400A' },
                        { name: '용접 전압', value: '15-35V' },
                        { name: '용접 속도', value: '10-50 cm/분' },
                        { name: '전극 직경', value: '2.6-4.0mm' },
                        { name: '듀티 사이클', value: '60%' },
                        { name: '보호 가스', value: 'Ar + CO2' }
                    );
                }
                break;
                
            case 'utility':
                if (equipmentId.includes('COOL')) {
                    specs.push(
                        { name: '냉각 용량', value: '500 RT' },
                        { name: '냉매 타입', value: 'R-134a' },
                        { name: '압축기 출력', value: '200kW' },
                        { name: '냉각수 온도', value: '7-12°C' },
                        { name: '유량', value: '2000 L/분' },
                        { name: '효율 등급', value: 'COP 3.2' }
                    );
                } else if (equipmentId.includes('COMP')) {
                    specs.push(
                        { name: '토출 압력', value: '8 bar' },
                        { name: '토출량', value: '500 m³/h' },
                        { name: '압축기 타입', value: '스크류식' },
                        { name: '모터 출력', value: '75kW' },
                        { name: '탱크 용량', value: '2000L' },
                        { name: '건조 방식', value: '냉동식' }
                    );
                } else if (equipmentId.includes('BOILER')) {
                    specs.push(
                        { name: '증기 압력', value: '10 bar' },
                        { name: '증기 온도', value: '184°C' },
                        { name: '연료 타입', value: 'LNG' },
                        { name: '효율', value: '92%' },
                        { name: '급수 온도', value: '105°C' },
                        { name: '안전밸브', value: '11 bar 설정' }
                    );
                } else if (equipmentId.includes('ELEC')) {
                    specs.push(
                        { name: '정격 전압', value: '22.9kV' },
                        { name: '정격 용량', value: '2000kVA' },
                        { name: '변압기 타입', value: '몰드형' },
                        { name: '절연 등급', value: 'F종' },
                        { name: '냉각 방식', value: 'AN' },
                        { name: '보호 계전기', value: 'OCR, DGPT' }
                    );
                } else if (equipmentId.includes('WATER')) {
                    specs.push(
                        { name: '처리 용량', value: '200 m³/일' },
                        { name: '처리 방식', value: '생물학적 + 물리화학적' },
                        { name: 'BOD 제거율', value: '95%' },
                        { name: 'COD 제거율', value: '90%' },
                        { name: 'SS 제거율', value: '98%' },
                        { name: '슬러지 농도', value: '3000 mg/L' }
                    );
                }
                break;
                
            case 'safety':
                if (equipmentId.includes('EMG')) {
                    specs.push(
                        { name: '응답 시간', value: '< 0.5초' },
                        { name: '적용 범위', value: '전체 공장' },
                        { name: '버튼 타입', value: '비접촉식' },
                        { name: '신호 전송', value: '광케이블' },
                        { name: '백업 전원', value: 'UPS 30분' },
                        { name: '인증', value: 'SIL 3' }
                    );
                } else if (equipmentId.includes('FIRE')) {
                    specs.push(
                        { name: '감지 방식', value: '연기+열 복합' },
                        { name: '감지 범위', value: '반경 10m' },
                        { name: '알람 시간', value: '< 30초' },
                        { name: '센서 수량', value: '247개' },
                        { name: '통신 방식', value: 'RS-485' },
                        { name: '인증', value: 'FM, UL' }
                    );
                } else if (equipmentId.includes('GAS')) {
                    specs.push(
                        { name: '검지 가스', value: 'CH4, H2S, CO' },
                        { name: '검지 범위', value: '0-100% LEL' },
                        { name: '정확도', value: '±3% F.S.' },
                        { name: '응답 시간', value: '< 10초' },
                        { name: '알람 설정', value: '25%, 50% LEL' },
                        { name: '방폭 등급', value: 'Ex d IIC T6' }
                    );
                } else if (equipmentId.includes('VALVE')) {
                    specs.push(
                        { name: '설정 압력', value: '12 bar' },
                        { name: '밸브 타입', value: '스프링식' },
                        { name: '연결 크기', value: 'DN50' },
                        { name: '재질', value: 'SUS316' },
                        { name: '인증', value: 'KGS, ASME' },
                        { name: '시험 압력', value: '18 bar' }
                    );
                } else if (equipmentId.includes('VENT')) {
                    specs.push(
                        { name: '풍량', value: '15000 m³/h' },
                        { name: '정압', value: '250 Pa' },
                        { name: '모터 출력', value: '30kW' },
                        { name: '필터 등급', value: 'HEPA H13' },
                        { name: '소음 수준', value: '< 65 dB' },
                        { name: '제어 방식', value: 'VFD' }
                    );
                }
                break;
                
            case 'quality':
                if (equipmentId.includes('SENSOR')) {
                    specs.push(
                        { name: '측정 항목', value: '온도, 압력, 유량' },
                        { name: '정확도', value: '±0.1% F.S.' },
                        { name: '샘플링 주기', value: '1초' },
                        { name: '통신 방식', value: 'Modbus TCP' },
                        { name: '데이터 저장', value: '30일' },
                        { name: '알람 기능', value: '상/하한 설정' }
                    );
                } else if (equipmentId.includes('INSPECT')) {
                    specs.push(
                        { name: '검사 속도', value: '200 개/시간' },
                        { name: '검사 정밀도', value: '99.8%' },
                        { name: '카메라 해상도', value: '5MP' },
                        { name: '조명 타입', value: 'LED 링 조명' },
                        { name: '처리 시간', value: '< 0.5초' },
                        { name: 'NG 분류', value: '자동 배출' }
                    );
                } else if (equipmentId.includes('LAB')) {
                    specs.push(
                        { name: '분석 항목', value: '15종' },
                        { name: '정밀도', value: '±0.05%' },
                        { name: '분석 시간', value: '10-30분' },
                        { name: '샘플 용량', value: '1-10ml' },
                        { name: '온도 범위', value: '15-35°C' },
                        { name: '교정 주기', value: '월 1회' }
                    );
                } else if (equipmentId.includes('WEIGHT')) {
                    specs.push(
                        { name: '측정 범위', value: '0.1-50kg' },
                        { name: '정확도', value: '±1g' },
                        { name: '최소 표시', value: '0.1g' },
                        { name: '측정 속도', value: '10회/초' },
                        { name: '로드셀 타입', value: '전자식' },
                        { name: '인증', value: 'OIML R76' }
                    );
                }
                break;
                
            case 'maintenance':
                if (equipmentId.includes('TOOL')) {
                    specs.push(
                        { name: '보관 도구', value: '247종' },
                        { name: '재고 관리', value: 'RFID' },
                        { name: '대여 시스템', value: '자동화' },
                        { name: '위치 추적', value: 'GPS' },
                        { name: '점검 주기', value: '월 1회' },
                        { name: '가용률', value: '95%' }
                    );
                } else if (equipmentId.includes('SPARE')) {
                    specs.push(
                        { name: '저장 품목', value: '1247종' },
                        { name: '재고율', value: '85%' },
                        { name: '온도 관리', value: '18-25°C' },
                        { name: '습도 관리', value: '40-60%' },
                        { name: '보관 방식', value: '자동창고' },
                        { name: '입출고', value: 'WMS 연동' }
                    );
                } else if (equipmentId.includes('CRANE')) {
                    specs.push(
                        { name: '인양 하중', value: '10 ton' },
                        { name: '스팬', value: '20m' },
                        { name: '양정', value: '12m' },
                        { name: '횡행 속도', value: '20 m/분' },
                        { name: '권상 속도', value: '8 m/분' },
                        { name: '안전 장치', value: '과부하 방지' }
                    );
                } else if (equipmentId.includes('DIAGNOSTIC')) {
                    specs.push(
                        { name: '진단 항목', value: '25종' },
                        { name: '측정 정확도', value: '99%' },
                        { name: '진단 시간', value: '5-30분' },
                        { name: '데이터 저장', value: '5년' },
                        { name: '리포트', value: '자동 생성' },
                        { name: '예측 정비', value: 'AI 분석' }
                    );
                }
                break;
                
            default:
                specs.push(
                    { name: '설치 일자', value: '2023-05-15' },
                    { name: '제조사', value: 'NEXUS Engineering' },
                    { name: '모델명', value: 'NX-' + equipmentId.substring(0, 3) + '-2024' },
                    { name: '보증 기간', value: '2년' },
                    { name: '점검 주기', value: '월 1회' },
                    { name: '운영 온도', value: '5-40°C' }
                );
        }
        
        return specs;
    }
    
    getSpecDisplayName(key) {
        const names = {
            'capacity': '용량',
            'power': '전력',
            'pressure': '압력',
            'temp': '온도',
            'speed': '속도',
            'voltage': '전압',
            'current': '전류',
            'flow': '유량',
            'efficiency': '효율',
            'accuracy': '정확도',
            'response': '응답시간',
            'coverage': '적용범위',
            'throughput': '처리량',
            'range': '측정범위',
            'sensors': '센서수',
            'alarm': '알람방식',
            'sensitivity': '감도',
            'type_valve': '밸브타입',
            'airflow': '풍량',
            'sampling': '샘플링',
            'tests': '테스트항목',
            'precision': '정밀도',
            'tools': '도구수',
            'availability': '가용률',
            'items': '보관품목',
            'stock': '재고율',
            'reach': '도달거리'
        };
        return names[key] || key;
    }
    
    generatePerformanceMetrics(node) {
        // 실시간 성능 지표 시뮬레이션
        const metrics = [
            { label: '가동률', value: Math.floor(Math.random() * 20 + 80), unit: '%', color: 'success' },
            { label: '효율성', value: Math.floor(Math.random() * 15 + 85), unit: '%', color: 'primary' },
            { label: '에너지', value: Math.floor(Math.random() * 30 + 70), unit: 'kW', color: 'warning' }
        ];
        
        return metrics.map(metric => `
            <div class="text-center">
                <div class="text-2xl font-bold text-${metric.color}">${metric.value}${metric.unit}</div>
                <div class="text-xs text-slate-400">${metric.label}</div>
                <div class="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                    <div class="bg-${metric.color} h-1.5 rounded-full" style="width: ${metric.value}%"></div>
                </div>
            </div>
        `).join('');
    }
    
    // 모달 제어 함수들
    showModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    }
    
    hideModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }
    
    // 리포트 모달 기능
    showReportModal() {
        const modal = document.getElementById('report-modal');
        const content = document.getElementById('report-content');
        
        const reportData = this.generateReportData();
        
        content.innerHTML = `
            <div class="space-y-6">
                <!-- 리포트 헤더 -->
                <div class="text-center border-b border-slate-600/30 pb-6">
                    <h1 class="text-2xl font-bold text-white mb-2">NEXUS Engineering Solutions</h1>
                    <h2 class="text-xl text-slate-300 mb-4">스마트팩토리 통합 분석 리포트</h2>
                    <div class="flex justify-center space-x-8 text-sm">
                        <div>
                            <span class="text-slate-400">생성일시:</span>
                            <span class="font-medium">${new Date().toLocaleString('ko-KR')}</span>
                        </div>
                        <div>
                            <span class="text-slate-400">분석 기간:</span>
                            <span class="font-medium">2024.12.01 - 2024.12.20</span>
                        </div>
                    </div>
                </div>
                
                <!-- 전체 요약 -->
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="card p-4 text-center">
                        <div class="text-2xl font-bold text-primary">${reportData.totalEquipment}</div>
                        <div class="text-sm text-slate-400">총 설비 수</div>
                    </div>
                    <div class="card p-4 text-center">
                        <div class="text-2xl font-bold text-success">${reportData.normalEquipment}</div>
                        <div class="text-sm text-slate-400">정상 설비</div>
                    </div>
                    <div class="card p-4 text-center">
                        <div class="text-2xl font-bold text-warning">${reportData.warningEquipment}</div>
                        <div class="text-sm text-slate-400">주의 설비</div>
                    </div>
                    <div class="card p-4 text-center">
                        <div class="text-2xl font-bold text-danger">${reportData.criticalEquipment}</div>
                        <div class="text-sm text-slate-400">위험 설비</div>
                    </div>
                </div>
                
                <!-- 네트워크 분석 -->
                <div class="card p-6">
                    <h3 class="text-lg font-bold text-white mb-4">네트워크 연결성 분석</h3>
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h4 class="font-semibold text-slate-300 mb-3">연결도 분석</h4>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span>총 연결 수:</span>
                                    <span class="font-medium">${reportData.totalConnections}개</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>평균 연결도:</span>
                                    <span class="font-medium">${reportData.avgConnectivity}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>최대 연결 설비:</span>
                                    <span class="font-medium">${reportData.mostConnectedNode}</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h4 class="font-semibold text-slate-300 mb-3">중요도 순위</h4>
                            <div class="space-y-2 text-sm">
                                ${reportData.criticalNodes.map((node, index) => `
                                    <div class="flex items-center justify-between">
                                        <span class="flex items-center">
                                            <span class="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center mr-2">${index + 1}</span>
                                            ${node.label}
                                        </span>
                                        <span class="text-xs text-slate-400">${node.connections}개 연결</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 성능 분석 -->
                <div class="card p-6">
                    <h3 class="text-lg font-bold text-white mb-4">설비 성능 분석</h3>
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div class="text-center">
                            <div class="text-3xl font-bold text-success mb-2">${reportData.avgUptime}%</div>
                            <div class="text-sm text-slate-400">평균 가동률</div>
                            <div class="w-full bg-slate-700 rounded-full h-2 mt-3">
                                <div class="bg-success h-2 rounded-full" style="width: ${reportData.avgUptime}%"></div>
                            </div>
                        </div>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-primary mb-2">${reportData.avgEfficiency}%</div>
                            <div class="text-sm text-slate-400">평균 효율성</div>
                            <div class="w-full bg-slate-700 rounded-full h-2 mt-3">
                                <div class="bg-primary h-2 rounded-full" style="width: ${reportData.avgEfficiency}%"></div>
                            </div>
                        </div>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-warning mb-2">${reportData.energyUsage}</div>
                            <div class="text-sm text-slate-400">총 에너지 사용량 (kWh)</div>
                            <div class="text-xs text-slate-400 mt-2">전월 대비 -5.2%</div>
                        </div>
                    </div>
                </div>
                
                <!-- 부서별 현황 -->
                <div class="card p-6">
                    <h3 class="text-lg font-bold text-white mb-4">부서별 설비 현황</h3>
                    <div class="space-y-3">
                        ${reportData.departmentStatus.map(dept => `
                            <div class="flex items-center justify-between p-3 bg-slate-700/30 rounded">
                                <span class="font-medium">${dept.name}</span>
                                <div class="flex items-center space-x-4 text-sm">
                                    <span class="text-green-400">정상 ${dept.normal}</span>
                                    <span class="text-yellow-400">주의 ${dept.warning}</span>
                                    <span class="text-red-400">위험 ${dept.critical}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- 권장사항 -->
                <div class="card p-6">
                    <h3 class="text-lg font-bold text-white mb-4">AI 권장사항</h3>
                    <div class="space-y-3">
                        ${reportData.recommendations.map(rec => `
                            <div class="flex items-start space-x-3 p-3 bg-slate-700/30 rounded">
                                <div class="w-2 h-2 rounded-full bg-${rec.priority === 'high' ? 'red' : rec.priority === 'medium' ? 'yellow' : 'blue'}-400 mt-2 flex-shrink-0"></div>
                                <div>
                                    <div class="font-medium text-white">${rec.title}</div>
                                    <div class="text-sm text-slate-300 mt-1">${rec.description}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        this.showModal('report-modal');
    }
    
    generateReportData() {
        if (!this.currentData) return {};
        
        const totalEquipment = this.currentData.nodes.length;
        const statusCounts = { normal: 0, warning: 0, critical: 0, maintenance: 0 };
        
        this.currentData.nodes.forEach(node => {
            statusCounts[node.status]++;
        });
        
        // 연결도 분석
        const connectionCounts = {};
        this.currentData.links.forEach(link => {
            connectionCounts[link.source.id] = (connectionCounts[link.source.id] || 0) + 1;
            connectionCounts[link.target.id] = (connectionCounts[link.target.id] || 0) + 1;
        });
        
        const criticalNodes = this.currentData.nodes
            .map(node => ({
                ...node,
                connections: connectionCounts[node.id] || 0
            }))
            .sort((a, b) => b.connections - a.connections)
            .slice(0, 5);
        
        const mostConnectedNode = criticalNodes[0]?.label || '없음';
        const avgConnectivity = (this.currentData.links.length * 2 / totalEquipment).toFixed(1);
        
        // 부서별 현황
        const departmentStatus = {};
        this.currentData.nodes.forEach(node => {
            if (!departmentStatus[node.department]) {
                departmentStatus[node.department] = { normal: 0, warning: 0, critical: 0 };
            }
            departmentStatus[node.department][node.status]++;
        });
        
        return {
            totalEquipment,
            normalEquipment: statusCounts.normal,
            warningEquipment: statusCounts.warning,
            criticalEquipment: statusCounts.critical,
            totalConnections: this.currentData.links.length,
            avgConnectivity,
            mostConnectedNode,
            criticalNodes,
            avgUptime: 94.2,
            avgEfficiency: 87.8,
            energyUsage: '1,247',
            departmentStatus: Object.keys(departmentStatus).map(dept => ({
                name: dept,
                ...departmentStatus[dept]
            })),
            recommendations: [
                {
                    priority: 'high',
                    title: 'CONV-B2-1456 벨트 장력 조정 필요',
                    description: '컨베이어 벨트의 장력이 허용 범위를 벗어났습니다. 즉시 정비 팀에 연락하여 조정 작업을 진행하시기 바랍니다.'
                },
                {
                    priority: 'medium',
                    title: '정기 점검 스케줄 최적화',
                    description: '현재 정비 일정을 분석한 결과, 예방 정비 주기를 조정하면 가동률을 2-3% 향상시킬 수 있습니다.'
                },
                {
                    priority: 'low',
                    title: '에너지 효율성 개선 방안',
                    description: '비가동 시간대 에너지 사용량을 줄이기 위한 자동 절전 모드 도입을 검토해보시기 바랍니다.'
                }
            ]
        };
    }
    
    downloadReport() {
        const reportContent = document.getElementById('report-content').innerHTML;
        const isLightMode = document.documentElement.classList.contains('light-theme');
        
        const fullReport = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>NEXUS SmartPlant Analytics Report</title>
                <style>
                    * { box-sizing: border-box; }
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                        background: ${isLightMode ? '#ffffff' : '#1e293b'}; 
                        color: ${isLightMode ? '#111827' : '#e2e8f0'}; 
                        margin: 20px; 
                        line-height: 1.6;
                    }
                    
                    /* Layout Classes */
                    .space-y-6 > * + * { margin-top: 1.5rem; }
                    .space-y-3 > * + * { margin-top: 0.75rem; }
                    .space-y-2 > * + * { margin-top: 0.5rem; }
                    .space-x-8 > * + * { margin-left: 2rem; }
                    .space-x-4 > * + * { margin-left: 1rem; }
                    .space-x-3 > * + * { margin-left: 0.75rem; }
                    
                    .grid { display: grid; }
                    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                    .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
                    .lg\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                    .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
                    .lg\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
                    .gap-4 { gap: 1rem; }
                    .gap-6 { gap: 1.5rem; }
                    
                    .flex { display: flex; }
                    .flex-1 { flex: 1 1 0%; }
                    .flex-shrink-0 { flex-shrink: 0; }
                    .items-center { align-items: center; }
                    .items-start { align-items: flex-start; }
                    .justify-center { justify-content: center; }
                    .justify-between { justify-content: space-between; }
                    
                    /* Typography */
                    .text-2xl { font-size: 1.5rem; line-height: 2rem; }
                    .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
                    .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
                    .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
                    .text-xs { font-size: 0.75rem; line-height: 1rem; }
                    .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
                    
                    .font-bold { font-weight: 700; }
                    .font-semibold { font-weight: 600; }
                    .font-medium { font-weight: 500; }
                    
                    .text-center { text-align: center; }
                    
                    /* Colors */
                    .text-white { color: ${isLightMode ? '#111827' : '#ffffff'}; }
                    .text-slate-300 { color: ${isLightMode ? '#374151' : '#cbd5e1'}; }
                    .text-slate-400 { color: ${isLightMode ? '#64748b' : '#94a3b8'}; }
                    .text-primary { color: #2563EB; }
                    .text-success { color: #22C55E; }
                    .text-warning { color: #F59E0B; }
                    .text-danger { color: #EF4444; }
                    .text-green-400 { color: #4ade80; }
                    .text-blue-400 { color: #60a5fa; }
                    .text-red-400 { color: #f87171; }
                    .text-yellow-400 { color: #facc15; }
                    
                    /* Background Colors */
                    .bg-primary\\/20 { background-color: rgba(37, 99, 235, 0.2); }
                    .bg-red-400 { background-color: #f87171; }
                    .bg-yellow-400 { background-color: #facc15; }
                    .bg-blue-400 { background-color: #60a5fa; }
                    .bg-success { background-color: #22C55E; }
                    .bg-slate-700 { background-color: ${isLightMode ? '#e2e8f0' : '#334155'}; }
                    .bg-slate-700\\/30 { background-color: ${isLightMode ? 'rgba(226, 232, 240, 0.3)' : 'rgba(51, 65, 85, 0.3)'}; }
                    
                    /* Card */
                    .card { 
                        background: ${isLightMode ? '#f8fafc' : '#334155'}; 
                        border-radius: 12px; 
                        border: 1px solid ${isLightMode ? '#d1d5db' : '#475569'}; 
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    }
                    
                    /* Padding */
                    .p-4 { padding: 1rem; }
                    .p-6 { padding: 1.5rem; }
                    .p-3 { padding: 0.75rem; }
                    .pb-6 { padding-bottom: 1.5rem; }
                    
                    /* Margin */
                    .mb-2 { margin-bottom: 0.5rem; }
                    .mb-3 { margin-bottom: 0.75rem; }
                    .mb-4 { margin-bottom: 1rem; }
                    .mt-1 { margin-top: 0.25rem; }
                    .mt-2 { margin-top: 0.5rem; }
                    .mt-3 { margin-top: 0.75rem; }
                    .mr-2 { margin-right: 0.5rem; }
                    
                    /* Width & Height */
                    .w-2 { width: 0.5rem; }
                    .w-6 { width: 1.5rem; }
                    .w-full { width: 100%; }
                    .h-2 { height: 0.5rem; }
                    .h-6 { height: 1.5rem; }
                    
                    /* Border */
                    .border-b { border-bottom-width: 1px; }
                    .border-slate-600\\/30 { border-color: rgba(71, 85, 105, 0.3); }
                    .rounded { border-radius: 0.25rem; }
                    .rounded-full { border-radius: 9999px; }
                    .rounded-lg { border-radius: 0.5rem; }
                    
                    /* Progress Bar */
                    .progress-bar {
                        width: 100%;
                        background-color: #334155;
                        border-radius: 9999px;
                        height: 0.5rem;
                        margin-top: 0.75rem;
                    }
                    .progress-fill {
                        height: 0.5rem;
                        border-radius: 9999px;
                        transition: width 0.3s ease;
                    }
                    
                    /* Responsive */
                    @media (min-width: 1024px) {
                        .lg\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                        .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
                        .lg\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
                    }
                    
                    /* Print Styles */
                    @media print {
                        body { background: white; color: black; }
                        .card { border: 1px solid #ccc; background: white; }
                        .text-white, .text-slate-300, .text-slate-400 { color: black !important; }
                    }
                </style>
            </head>
            <body>
                ${reportContent}
            </body>
            </html>
        `;
        
        const blob = new Blob([fullReport], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `NEXUS_SmartPlant_Analytics_Report_${new Date().toISOString().split('T')[0]}.html`;
        link.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('리포트 HTML 파일이 성공적으로 다운로드되었습니다.', 'success');
    }
    
    downloadReportAsImage() {
        const reportElement = document.getElementById('report-content');
        const isLightMode = document.documentElement.classList.contains('light-theme');
        
        // 로딩 표시
        const downloadBtn = document.getElementById('download-report-image');
        const originalText = downloadBtn.innerHTML;
        downloadBtn.innerHTML = '<i class="ri-loader-4-line animate-spin mr-2"></i>생성 중...';
        downloadBtn.disabled = true;
        
        // 이미지 생성을 위해 테마에 맞는 색상 설정
        const tempStyle = document.createElement('style');
        tempStyle.id = 'temp-image-style';
        
        if (isLightMode) {
            // 라이트모드용 스타일
            tempStyle.textContent = `
                #report-content {
                    background: #ffffff !important;
                    color: #111827 !important;
                }
                #report-content .card {
                    background: #f8fafc !important;
                    border: 1px solid #d1d5db !important;
                }
                #report-content .text-white,
                #report-content .text-slate-300,
                #report-content .text-slate-400,
                #report-content h3,
                #report-content h4,
                #report-content .font-medium:not(.text-green-400):not(.text-blue-400):not(.text-orange-400):not(.text-red-400):not(.text-yellow-400):not(.text-primary):not(.text-success):not(.text-warning):not(.text-danger),
                #report-content .font-semibold:not(.text-green-400):not(.text-blue-400):not(.text-orange-400):not(.text-red-400):not(.text-yellow-400):not(.text-primary):not(.text-success):not(.text-warning):not(.text-danger),
                #report-content span:not([class*="text-green"]):not([class*="text-blue"]):not([class*="text-orange"]):not([class*="text-red"]):not([class*="text-yellow"]):not([class*="text-primary"]):not([class*="text-success"]):not([class*="text-warning"]):not([class*="text-danger"]) {
                    color: #111827 !important;
                }
                #report-content .bg-slate-700 {
                    background-color: #e2e8f0 !important;
                }
            `;
        } else {
            // 다크모드용 스타일 (기존)
            tempStyle.textContent = `
                #report-content {
                    background: #1e293b !important;
                    color: #e2e8f0 !important;
                }
                #report-content .text-slate-700,
                #report-content .text-slate-600,
                #report-content .text-slate-800,
                #report-content .text-slate-300,
                #report-content .text-slate-400,
                #report-content .text-gray-700,
                #report-content .text-gray-600,
                #report-content .text-gray-800,
                #report-content h3,
                #report-content h4,
                #report-content .bg-slate-700 td,
                #report-content .bg-slate-800 td,
                #report-content .font-medium:not(.text-green-400):not(.text-blue-400):not(.text-orange-400):not(.text-red-400):not(.text-yellow-400):not(.text-primary):not(.text-success):not(.text-warning):not(.text-danger),
                #report-content .font-semibold:not(.text-green-400):not(.text-blue-400):not(.text-orange-400):not(.text-red-400):not(.text-yellow-400):not(.text-primary):not(.text-success):not(.text-warning):not(.text-danger),
                #report-content .card span:not(.text-green-400):not(.text-blue-400):not(.text-orange-400):not(.text-red-400):not(.text-yellow-400):not(.text-primary):not(.text-success):not(.text-warning):not(.text-danger),
                #report-content .card div:not(.text-green-400):not(.text-blue-400):not(.text-orange-400):not(.text-red-400):not(.text-yellow-400):not(.text-primary):not(.text-success):not(.text-warning):not(.text-danger),
                #report-content span:not([class*="text-"]),
                #report-content div:not([class*="text-"]):not([class*="bg-"]):not([class*="w-"]):not([class*="h-"]):not([class*="flex"]):not([class*="grid"]):not([class*="space-"]) {
                    color: #ffffff !important;
                }
            `;
        }
        document.head.appendChild(tempStyle);
        
        // 잠시 대기 후 이미지 생성 (스타일 적용 시간)
        setTimeout(() => {
        // html2canvas로 이미지 생성
        html2canvas(reportElement, {
            backgroundColor: isLightMode ? '#ffffff' : '#1e293b',
            scale: 2, // 고화질을 위한 스케일링
            useCORS: true,
            allowTaint: true,
            width: reportElement.scrollWidth,
            height: reportElement.scrollHeight
        }).then(canvas => {
                // 임시 스타일 제거
                const tempStyleElement = document.getElementById('temp-image-style');
                if (tempStyleElement) {
                    tempStyleElement.remove();
                }
                
            // 캔버스를 이미지로 변환
            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `NEXUS_SmartPlant_Report_${new Date().toISOString().split('T')[0]}.png`;
                link.click();
                URL.revokeObjectURL(url);
                
                // 버튼 상태 복원
                downloadBtn.innerHTML = originalText;
                downloadBtn.disabled = false;
                
                this.showNotification('리포트 이미지가 성공적으로 다운로드되었습니다.', 'success');
            }, 'image/png');
        }).catch(error => {
            console.error('이미지 생성 실패:', error);
                
                // 임시 스타일 제거
                const tempStyleElement = document.getElementById('temp-image-style');
                if (tempStyleElement) {
                    tempStyleElement.remove();
                }
                
            this.showNotification('이미지 생성에 실패했습니다. 다시 시도해주세요.', 'error');
            
            // 버튼 상태 복원
            downloadBtn.innerHTML = originalText;
            downloadBtn.disabled = false;
        });
        }, 100); // 100ms 대기
    }
    
    // 공유 모달 기능
    async showShareModal() {
        // 현재 데이터와 설정을 서버에 업로드하여 공유 링크 생성
        const shareBtn = document.getElementById('share-btn');
        const originalText = shareBtn.innerHTML;
        shareBtn.innerHTML = '<i class="ri-loader-4-line animate-spin mr-2"></i>준비 중...';
        shareBtn.disabled = true;
        
        try {
            const shareData = {
                data: this.currentData,
                settings: {
                    layout: this.currentLayout || 'force',
                    nodeSize: document.getElementById('node-size')?.value || 20,
                    linkDistance: document.getElementById('link-distance')?.value || 100,
                    charge: document.getElementById('charge-strength')?.value || -300
                },
                metadata: {
                    title: 'NEXUS 설비 네트워크 분석 데이터',
                    description: `${this.currentData?.nodes?.length || 0}개 설비, ${this.currentData?.links?.length || 0}개 연결`,
                    createdBy: 'NEXUS 사용자',
                    accessLevel: 'read-only'
                }
            };
            
            const response = await fetch('/api/share/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(shareData)
            });
            
            if (!response.ok) {
                throw new Error('공유 링크 생성에 실패했습니다.');
            }
            
            const result = await response.json();
            
            // 공유 링크를 모달에 표시
            document.getElementById('share-link').value = result.shareUrl;
            this.currentShareData = result;
            
        this.showModal('share-modal');
            
        } catch (error) {
            console.error('공유 링크 생성 오류:', error);
            this.showNotification('공유 링크 생성에 실패했습니다. 다시 시도해주세요.', 'error');
        } finally {
            shareBtn.innerHTML = originalText;
            shareBtn.disabled = false;
        }
    }
    
    copyShareLink() {
        const shareLink = document.getElementById('share-link');
        shareLink.select();
        shareLink.setSelectionRange(0, 99999);
        
        navigator.clipboard.writeText(shareLink.value).then(() => {
            const copyBtn = document.getElementById('copy-link');
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="ri-check-line"></i>';
            copyBtn.classList.add('bg-success');
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.classList.remove('bg-success');
            }, 2000);
            
            this.showNotification('공유 링크가 클립보드에 복사되었습니다.', 'success');
        }).catch(() => {
            this.showNotification('클립보드 복사에 실패했습니다.', 'error');
        });
    }
    
    // 이메일 공유 기능
    async shareViaEmail() {
        const recipient = prompt('수신자 이메일 주소를 입력하세요:');
        if (!recipient) return;
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(recipient)) {
            this.showNotification('올바른 이메일 주소를 입력해주세요.', 'error');
            return;
        }
        
        const message = prompt('추가 메시지 (선택사항):') || '';
        
        if (!this.currentShareData) {
            this.showNotification('먼저 공유 링크를 생성해주세요.', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/share/email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    shareUrl: this.currentShareData.shareUrl,
                    recipient: recipient,
                    message: message
                })
            });
            
            if (!response.ok) {
                throw new Error('이메일 전송에 실패했습니다.');
            }
            
            const result = await response.json();
            this.showNotification(result.message, 'success');
            
        } catch (error) {
            console.error('이메일 공유 오류:', error);
            this.showNotification('이메일 전송에 실패했습니다.', 'error');
        }
    }
    
    // 카카오톡 공유 기능 (시뮬레이션)
    shareViaKakao() {
        if (!this.currentShareData) {
            this.showNotification('먼저 공유 링크를 생성해주세요.', 'error');
            return;
        }
        
        // 실제 환경에서는 카카오 SDK 사용
        const kakaoMessage = `NEXUS 설비 네트워크 분석 데이터를 공유합니다.\n\n${this.currentShareData.shareUrl}`;
        
        // 시뮬레이션: 클립보드에 복사
        navigator.clipboard.writeText(kakaoMessage).then(() => {
            this.showNotification('카카오톡 공유 메시지가 클립보드에 복사되었습니다. (시뮬레이션)', 'info');
        }).catch(() => {
            this.showNotification('카카오톡 공유에 실패했습니다.', 'error');
        });
    }
    
    // 공유된 데이터 로드 기능
    async loadSharedData() {
        const urlParams = new URLSearchParams(window.location.search);
        const shareId = urlParams.get('shareId');
        
        if (!shareId) return;
        
        try {
            const response = await fetch(`/api/share/${shareId}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    this.showNotification('공유 링크를 찾을 수 없습니다.', 'error');
                } else if (response.status === 410) {
                    this.showNotification('공유 링크가 만료되었습니다.', 'error');
                } else {
                    throw new Error('공유 데이터 로드에 실패했습니다.');
                }
                return;
            }
            
            const result = await response.json();
            
            // 공유된 데이터로 시각화 업데이트
            this.currentData = result.data;
            this.createNetworkVisualization(result.data);
            this.updateStats();
            
            // 공유된 설정 적용
            if (result.settings) {
                if (result.settings.layout) {
                    this.changeLayout(result.settings.layout);
                }
                if (result.settings.nodeSize) {
                    this.updateNodeSize(result.settings.nodeSize);
                }
                if (result.settings.linkDistance) {
                    this.updateLinkDistance(result.settings.linkDistance);
                }
                if (result.settings.charge) {
                    this.updateCharge(result.settings.charge);
                }
            }
            
            // 공유 정보 표시
            this.showNotification(`공유된 데이터가 로드되었습니다. (${result.metadata.createdBy}님이 공유)`, 'success');
            
            // URL에서 shareId 파라미터 제거
            const newUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
            
        } catch (error) {
            console.error('공유 데이터 로드 오류:', error);
            this.showNotification('공유 데이터 로드에 실패했습니다.', 'error');
        }
    }
    
    // 설정 모달 기능
    showSettingsModal() {
        this.showModal('settings-modal');
    }
    
    saveSettings() {
        const settings = {
            darkTheme: document.getElementById('dark-theme-toggle').checked,
            autoSave: document.getElementById('auto-save-toggle').checked,
            notifications: document.getElementById('notifications-toggle').checked,
            defaultLayout: document.getElementById('default-layout').value,
            animationSpeed: document.getElementById('animation-speed').value,
            showLabels: document.getElementById('show-labels-toggle').checked,
            updateInterval: document.getElementById('update-interval').value
        };
        
        // 로컬 스토리지에 설정 저장
        localStorage.setItem('equipmentMapperSettings', JSON.stringify(settings));
        
        // 설정 적용
        this.applySettingsChanges(settings);
        
        // 성공 알림
        this.showNotification('설정이 저장되었습니다.', 'success');
        this.hideModal('settings-modal');
    }
    
    resetSettings() {
        if (confirm('설정을 기본값으로 복원하시겠습니까?')) {
            // 기본값으로 리셋
            document.getElementById('dark-theme-toggle').checked = true;
            document.getElementById('auto-save-toggle').checked = true;
            document.getElementById('notifications-toggle').checked = true;
            document.getElementById('default-layout').value = 'force';
            document.getElementById('animation-speed').value = 1;
            document.getElementById('show-labels-toggle').checked = true;
            document.getElementById('update-interval').value = 5000;
            
            // 로컬 스토리지 클리어
            localStorage.removeItem('equipmentMapperSettings');
            
            this.showNotification('설정이 기본값으로 복원되었습니다.', 'info');
        }
    }
    
    applySettingsChanges(settings) {
        // 실시간 업데이트 주기 변경
        if (this.realTimeInterval) {
            clearInterval(this.realTimeInterval);
            if (this.isRealTimeMode) {
                this.realTimeInterval = setInterval(() => {
                    this.simulateRealTimeData();
                }, parseInt(settings.updateInterval));
            }
        }
        
        // 라벨 표시/숨김
        this.g.selectAll('.node-label').style('display', settings.showLabels ? 'block' : 'none');
        
        // 기본 레이아웃 적용
        this.changeLayout(settings.defaultLayout);
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg text-white z-50 transition-all duration-300 ${
            type === 'success' ? 'bg-green-600' : 
            type === 'warning' ? 'bg-yellow-600' : 
            type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`;
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="ri-${type === 'success' ? 'check' : type === 'warning' ? 'alert' : type === 'error' ? 'close' : 'information'}-line"></i>
                <span>${message}</span>
            </div>
        `;
        
        // 라이트모드에서도 확실하게 흰색 텍스트 적용
        notification.style.color = 'white';
        const span = notification.querySelector('span');
        const icon = notification.querySelector('i');
        if (span) span.style.color = 'white';
        if (icon) icon.style.color = 'white';
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    refreshData() {
        // 로딩 표시
        const syncBtn = document.getElementById('sync-btn');
        const originalIcon = syncBtn.innerHTML;
        syncBtn.innerHTML = '<i class="ri-loader-4-line animate-spin"></i>';
        syncBtn.disabled = true;
        
        this.showNotification('데이터를 새로고침하고 있습니다...', 'info');
        
        // 실제 새로고침 시뮬레이션
        setTimeout(() => {
            // 현재 데이터 재로드
            this.loadSampleData();
            
            // 실시간 데이터 시뮬레이션 (상태 변경)
            if (this.currentData && this.currentData.nodes) {
                this.currentData.nodes.forEach(node => {
                    // 10% 확률로 상태 변경
                    if (Math.random() < 0.1) {
                        const statuses = ['normal', 'warning', 'critical'];
                        node.status = statuses[Math.floor(Math.random() * statuses.length)];
                    }
                });
                
                // 시각화 업데이트
                this.createNetworkVisualization(this.currentData);
                this.updateStats();
            }
            
            // 버튼 상태 복원
            syncBtn.innerHTML = originalIcon;
            syncBtn.disabled = false;
            
            this.showNotification('데이터가 성공적으로 새로고침되었습니다.', 'success');
            
            // 마지막 동기화 시간 업데이트
            this.updateLastSyncTime();
        }, 2000); // 2초 대기로 실제 동기화하는 느낌
    }
    
    updateLastSyncTime() {
        const syncTimeElement = document.querySelector('p.text-sm.text-slate-400');
        if (syncTimeElement) {
            const now = new Date();
            const timeString = now.toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            syncTimeElement.innerHTML = `
                마지막 동기화: ${timeString} | 
                <span class="text-primary">MES-7000</span>, 
                <span class="text-accent">SCADA-8800</span> 연동
            `;
        }
    }
    
    // 사이드바 클릭 핸들러들
    handleEquipmentClick(equipmentId) {
        console.log('설비 클릭:', equipmentId);
        
        // 해당 설비 노드 찾기
        const node = this.currentData.nodes.find(n => n.id === equipmentId);
        if (node) {
            // 노드 하이라이트
            this.highlightNode(node);
            
            // 상세 모달 표시
            this.showNodeDetailModal(node);
        } else {
            console.warn('설비를 찾을 수 없습니다:', equipmentId);
            this.showNotification(`설비 ${equipmentId}를 찾을 수 없습니다.`, 'warning');
        }
    }
    
    handleLocationClick(location) {
        console.log('위치 클릭:', location);
        
        // 해당 위치의 설비들 필터링
        this.filterByLocation(location);
    }
    
    highlightNode(targetNode) {
        if (!this.svg || !targetNode) return;
        
        // 모든 노드와 링크 흐리게
        this.svg.selectAll('.node')
            .style('opacity', 0.3);
        this.svg.selectAll('.link')
            .style('opacity', 0.1);
        
        // 타겟 노드 강조
        this.svg.selectAll('.node')
            .filter(d => d.id === targetNode.id)
            .style('opacity', 1)
            .style('stroke', '#2563EB')
            .style('stroke-width', 3);
        
        // 연결된 링크들 강조
        this.svg.selectAll('.link')
            .filter(d => d.source.id === targetNode.id || d.target.id === targetNode.id)
            .style('opacity', 0.8)
            .style('stroke', '#2563EB');
        
        // 연결된 노드들 강조
        const connectedNodeIds = new Set();
        this.currentData.links.forEach(link => {
            if (link.source.id === targetNode.id) {
                connectedNodeIds.add(link.target.id);
            }
            if (link.target.id === targetNode.id) {
                connectedNodeIds.add(link.source.id);
            }
        });
        
        this.svg.selectAll('.node')
            .filter(d => connectedNodeIds.has(d.id))
            .style('opacity', 0.7);
        
        // 카메라를 해당 노드로 이동
        const nodeElement = this.svg.select('.node').filter(d => d.id === targetNode.id);
        if (!nodeElement.empty()) {
            const nodeData = nodeElement.datum();
            const transform = d3.zoomIdentity
                .translate(this.svg.attr('width') / 2 - nodeData.x, this.svg.attr('height') / 2 - nodeData.y)
                .scale(1.5);
            
            this.svg.transition()
                .duration(750)
                .call(this.zoom.transform, transform);
        }
        
        // 3초 후 하이라이트 해제
        setTimeout(() => {
            this.clearHighlight();
        }, 3000);
    }
    
    clearHighlight() {
        if (!this.svg) return;
        
        this.svg.selectAll('.node')
            .style('opacity', 1)
            .style('stroke', null)
            .style('stroke-width', null);
        this.svg.selectAll('.link')
            .style('opacity', 0.6)
            .style('stroke', d => this.getLinkColor(d.type));
    }
    
    filterByLocation(location) {
        console.log('위치별 필터링:', location);
        
        // 해당 위치의 설비들 찾기
        const filteredNodes = this.currentData.nodes.filter(node => 
            node.location && node.location.includes(location)
        );
        
        if (filteredNodes.length === 0) {
            this.showNotification(`${location}에 설비가 없습니다.`, 'warning');
            return;
        }
        
        // 필터링된 노드들만 표시
        this.svg.selectAll('.node')
            .style('opacity', d => 
                filteredNodes.some(fn => fn.id === d.id) ? 1 : 0.2
            );
        
        // 관련 링크들만 표시
        this.svg.selectAll('.link')
            .style('opacity', d => {
                const sourceMatch = filteredNodes.some(fn => fn.id === d.source.id);
                const targetMatch = filteredNodes.some(fn => fn.id === d.target.id);
                return (sourceMatch || targetMatch) ? 0.6 : 0.1;
            });
        
        // 알림 표시
        this.showNotification(`${location} 설비 ${filteredNodes.length}개를 표시합니다.`, 'info');
        
        // 5초 후 필터 해제
        setTimeout(() => {
            this.clearLocationFilter();
        }, 5000);
    }
    
    clearLocationFilter() {
        if (!this.svg) return;
        
        this.svg.selectAll('.node')
            .style('opacity', 1);
        this.svg.selectAll('.link')
            .style('opacity', 0.6);
    }
    
    // 사이드바 버튼 기능들
    refreshMonitoringData() {
        // 기존 새로고침 버튼과 동일한 기능 실행
        this.refreshData();
    }
    
    showStatsChart() {
        // 설비 현황 차트 모달 생성 및 표시
        this.createStatsChartModal();
    }
    
    createStatsChartModal() {
        // 기존 모달이 있으면 제거
        const existingModal = document.getElementById('stats-chart-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // 설비 타입별 통계 계산
        const typeStats = {};
        if (this.currentData && this.currentData.nodes) {
            this.currentData.nodes.forEach(node => {
                const type = node.type || 'unknown';
                if (!typeStats[type]) {
                    typeStats[type] = { total: 0, normal: 0, warning: 0, critical: 0 };
                }
                typeStats[type].total++;
                typeStats[type][node.status || 'normal']++;
            });
        }
        
        // 모달 HTML 생성
        const modalHTML = `
            <div id="stats-chart-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-slate-800 rounded-xl border border-slate-600 p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-xl font-bold text-slate-200">설비 현황 차트</h3>
                        <button id="close-stats-chart" class="text-slate-400 hover:text-white">
                            <i class="ri-close-line text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- 타입별 분포 -->
                        <div class="card p-4">
                            <h4 class="font-semibold text-slate-300 mb-4">설비 타입별 분포</h4>
                            <div class="space-y-3">
                                ${Object.entries(typeStats).map(([type, stats]) => `
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center">
                                            <div class="w-3 h-3 rounded-full mr-3" style="background: ${this.getTypeColor(type)};"></div>
                                            <span class="text-sm font-medium">${this.getTypeDisplayName(type)}</span>
                                        </div>
                                        <div class="flex items-center space-x-2">
                                            <span class="text-sm text-slate-400">${stats.total}개</span>
                                            <div class="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                                                <div class="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" 
                                                     style="width: ${(stats.total / Math.max(...Object.values(typeStats).map(s => s.total))) * 100}%"></div>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <!-- 상태별 분포 -->
                        <div class="card p-4">
                            <h4 class="font-semibold text-slate-300 mb-4">설비 상태별 분포</h4>
                            <div class="space-y-3">
                                ${Object.entries(typeStats).map(([type, stats]) => `
                                    <div class="mb-4">
                                        <div class="text-sm font-medium text-slate-300 mb-2">${this.getTypeDisplayName(type)}</div>
                                        <div class="flex space-x-1">
                                            <div class="flex-1 h-2 bg-green-500 rounded-l" style="flex: ${stats.normal}" title="정상: ${stats.normal}개"></div>
                                            <div class="flex-1 h-2 bg-yellow-500" style="flex: ${stats.warning}" title="경고: ${stats.warning}개"></div>
                                            <div class="flex-1 h-2 bg-red-500 rounded-r" style="flex: ${stats.critical}" title="위험: ${stats.critical}개"></div>
                                        </div>
                                        <div class="flex justify-between text-xs text-slate-400 mt-1">
                                            <span>정상 ${stats.normal}</span>
                                            <span>경고 ${stats.warning}</span>
                                            <span>위험 ${stats.critical}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <!-- 전체 통계 -->
                        <div class="card p-4 md:col-span-2">
                            <h4 class="font-semibold text-slate-300 mb-4">전체 설비 현황</h4>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div class="text-center">
                                    <div class="text-2xl font-bold text-blue-400">${Object.values(typeStats).reduce((sum, stats) => sum + stats.total, 0)}</div>
                                    <div class="text-sm text-slate-400">전체 설비</div>
                                </div>
                                <div class="text-center">
                                    <div class="text-2xl font-bold text-green-400">${Object.values(typeStats).reduce((sum, stats) => sum + stats.normal, 0)}</div>
                                    <div class="text-sm text-slate-400">정상 운영</div>
                                </div>
                                <div class="text-center">
                                    <div class="text-2xl font-bold text-yellow-400">${Object.values(typeStats).reduce((sum, stats) => sum + stats.warning, 0)}</div>
                                    <div class="text-sm text-slate-400">경고 상태</div>
                                </div>
                                <div class="text-center">
                                    <div class="text-2xl font-bold text-red-400">${Object.values(typeStats).reduce((sum, stats) => sum + stats.critical, 0)}</div>
                                    <div class="text-sm text-slate-400">위험 상태</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 모달을 DOM에 추가
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // 닫기 이벤트 리스너 추가
        document.getElementById('close-stats-chart').addEventListener('click', () => {
            document.getElementById('stats-chart-modal').remove();
        });
        
        // 배경 클릭 시 닫기
        document.getElementById('stats-chart-modal').addEventListener('click', (e) => {
            if (e.target.id === 'stats-chart-modal') {
                document.getElementById('stats-chart-modal').remove();
            }
        });
    }
    
    getTypeColor(type) {
        const colors = {
            'production': '#1E40AF',
            'utility': '#0D9488',
            'safety': '#EA580C',
            'quality': '#10B981',
            'maintenance': '#7C3AED'
        };
        return colors[type] || '#64748B';
    }
    
    updateNodeStyles() {
        if (!this.svg) return;
        
        this.svg.selectAll('.node')
            .attr('fill', d => {
                if (d.status === 'critical') return 'url(#criticalGradient)';
                if (d.status === 'warning') return 'url(#warningGradient)';
                return this.getNodeGradient(d.type);
            })
            .attr('stroke', d => {
                if (d.status === 'critical') return '#DC2626';
                if (d.status === 'warning') return '#D97706';
                return '#1E293B';
            });
    }
    
    toggleTheme() {
        const html = document.documentElement;
        const themeToggleBtn = document.getElementById('theme-toggle');
        const themeIcon = themeToggleBtn.querySelector('i');
        
        // 현재 테마 확인
        const isLightMode = html.classList.contains('light-theme');
        
        if (isLightMode) {
            // 다크모드로 전환
            html.classList.remove('light-theme');
            themeIcon.className = 'ri-moon-line text-lg';
            localStorage.setItem('theme', 'dark');
            this.showNotification('다크모드로 전환되었습니다.', 'info');
        } else {
            // 라이트모드로 전환
            html.classList.add('light-theme');
            themeIcon.className = 'ri-sun-line text-lg';
            localStorage.setItem('theme', 'light');
            this.showNotification('라이트모드로 전환되었습니다.', 'info');
        }
        
        // 네트워크 시각화 색상 업데이트
        this.updateVisualizationColors();
        
        // 강제로 페이지 스타일 새로고침
        this.forceStyleRefresh();
    }
    
    updateVisualizationColors() {
        if (!this.g) return;
        
        const isLightMode = document.documentElement.classList.contains('light-theme');
        
        // 노드 색상 업데이트
        this.g.selectAll('.node')
            .attr('stroke', d => this.statusColors[d.status]);
        
        this.g.selectAll('.status-indicator')
            .attr('fill', d => this.statusColors[d.status]);
        
        // 링크 색상 업데이트
        this.g.selectAll('.link')
            .attr('stroke', d => this.getLinkColor(d.type));
        
        // 텍스트 색상 업데이트 - 라이트모드에서 검은색
        this.g.selectAll('.node-label')
            .attr('fill', isLightMode ? '#111827' : '#f0f6fc')
            .style('text-shadow', isLightMode ? '1px 1px 2px rgba(255, 255, 255, 0.8)' : '1px 1px 2px rgba(0, 0, 0, 0.8)');
    }
    
    initializeTheme() {
        // 저장된 테마 설정 불러오기
        const savedTheme = localStorage.getItem('theme');
        const html = document.documentElement;
        const themeToggleBtn = document.getElementById('theme-toggle');
        const themeIcon = themeToggleBtn.querySelector('i');
        
        if (savedTheme === 'light') {
            html.classList.add('light-theme');
            themeIcon.className = 'ri-sun-line text-lg';
        } else {
            html.classList.remove('light-theme');
            themeIcon.className = 'ri-moon-line text-lg';
        }
    }
    
    forceStyleRefresh() {
        const isLightMode = document.documentElement.classList.contains('light-theme');
        
        // 중요한 요소들에 직접 스타일 적용
        const elementsToUpdate = [
            { selector: '.bg-slate-800', lightStyle: { backgroundColor: '#ffffff' } },
            { selector: '.bg-slate-700', lightStyle: { backgroundColor: '#f8fafc' } },
            { selector: '.bg-slate-900', lightStyle: { backgroundColor: '#f8fafc' } },
            { selector: '.text-slate-200', lightStyle: { color: '#0f172a' } },
            { selector: '.text-slate-300', lightStyle: { color: '#334155' } },
            { selector: '.text-slate-400', lightStyle: { color: '#64748b' } },
            { selector: '.text-white', lightStyle: { color: '#111827' } },
            { selector: '#network-container', lightStyle: { background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' } },
            { selector: 'select', lightStyle: { backgroundColor: '#ffffff', color: '#1f2937', borderColor: '#d1d5db' } },
            { selector: 'nav .text-slate-400', lightStyle: { color: '#1f2937' } },
            { selector: 'nav .text-slate-300', lightStyle: { color: '#374151' } },
            { selector: 'nav .text-slate-200', lightStyle: { color: '#111827' } },
            { selector: 'nav.glass', lightStyle: { background: 'rgba(255, 255, 255, 0.95)', borderColor: 'rgba(0, 0, 0, 0.1)' } },
            { selector: '.btn-primary', lightStyle: { color: 'white' } },
            { selector: '.btn-success', lightStyle: { color: 'white' } },
            { selector: '.btn-info', lightStyle: { color: 'white' } },
            { selector: '.btn-warning', lightStyle: { color: 'white' } },
            { selector: '#report-btn', lightStyle: { color: 'white' } },
            { selector: '#share-btn', lightStyle: { color: 'white' } },
            { selector: '#apply-settings', lightStyle: { color: 'white' } },
            { selector: '#reset-view', lightStyle: { color: '#111827' } },
            { selector: '.filter-btn.active', lightStyle: { color: 'white' } },
            { selector: '.bg-gradient-to-r.text-white', lightStyle: { color: 'white' } },
            { selector: '.bg-gradient-to-r .text-white', lightStyle: { color: 'white' } },
            { selector: '.bg-slate-700', lightStyle: { backgroundColor: '#e2e8f0' } },
            { selector: 'input[type="range"]', lightStyle: { backgroundColor: '#e2e8f0' } },
            { selector: '.bg-gradient-to-r.from-blue-500.to-blue-400', lightStyle: { background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' } },
            { selector: '.bg-slate-700.rounded-full.overflow-hidden', lightStyle: { backgroundColor: '#e2e8f0', border: '1px solid #cbd5e1' } }
        ];
        
        // 토글 스위치 색상 직접 업데이트
        const toggleSliders = document.querySelectorAll('.toggle-slider');
        toggleSliders.forEach(slider => {
            const checkbox = slider.previousElementSibling;
            if (isLightMode) {
                if (checkbox && checkbox.checked) {
                    slider.style.background = 'linear-gradient(135deg, #2563EB, #1D4ED8)';
                } else {
                    slider.style.background = '#cbd5e1';
                }
            } else {
                // 다크모드로 복원
                if (checkbox && checkbox.checked) {
                    slider.style.background = 'linear-gradient(135deg, #2563EB, #1D4ED8)';
                } else {
                    slider.style.background = '#475569';
                }
            }
        });
        
        // SVG 노드 라벨 색상 직접 업데이트 (CSS로 안 되는 경우 대비)
        if (this.g) {
            this.g.selectAll('.node-label')
                .attr('fill', isLightMode ? '#111827' : '#f0f6fc')
                .style('text-shadow', isLightMode ? '1px 1px 2px rgba(255, 255, 255, 0.8)' : '1px 1px 2px rgba(0, 0, 0, 0.8)');
        }
        
        elementsToUpdate.forEach(({ selector, lightStyle }) => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (isLightMode) {
                    Object.assign(el.style, lightStyle);
                } else {
                    // 다크모드일 때는 인라인 스타일 제거
                    Object.keys(lightStyle).forEach(prop => {
                        el.style[prop] = '';
                    });
                }
            });
        });
        
        // 페이지 새로고침 없이 스타일 업데이트
        setTimeout(() => {
            // 브라우저가 스타일을 재계산하도록 강제
            document.body.style.display = 'none';
            document.body.offsetHeight; // 강제 리플로우
            document.body.style.display = '';
        }, 10);
    }
}

// 윈도우 리사이즈 처리
window.addEventListener('resize', function() {
    if (window.equipmentMapper && window.equipmentMapper.svg) {
        const container = document.getElementById('network-container');
        window.equipmentMapper.svg.attr('width', container.clientWidth)
                                   .attr('height', container.clientHeight);
        
        if (window.equipmentMapper.simulation) {
            window.equipmentMapper.simulation.force('center', 
                d3.forceCenter(container.clientWidth / 2, container.clientHeight / 2));
            window.equipmentMapper.simulation.alpha(0.3).restart();
        }
    }
});

// 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', function() {
    window.equipmentMapper = new EquipmentNetworkMapper();
}); 