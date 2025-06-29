// 전역 변수
let currentData = null;
let simulation = null;
let svg = null;
let g = null;
let selectedNode = null;

// 노드 타입별 색상 정의
const nodeColors = {
    'heading': '#58a6ff',
    'wiki-link': '#3fb950',
    'external-link': '#d29922',
    'tag': '#f85149',
    'default': '#8b949e'
};

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeSVG();
});

// 이벤트 리스너 초기화
function initializeEventListeners() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    // 파일 입력 이벤트
    fileInput.addEventListener('change', handleFileSelect);
    
    // 드래그 앤 드롭 이벤트
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    uploadArea.addEventListener('click', () => fileInput.click());
    
    // 컨트롤 이벤트
    document.getElementById('nodeSize').addEventListener('input', updateVisualization);
    document.getElementById('linkDistance').addEventListener('input', updateVisualization);
    document.getElementById('charge').addEventListener('input', updateVisualization);
}

// SVG 초기화
function initializeSVG() {
    const container = document.querySelector('.graph-container');
    if (!container) return;
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    svg = d3.select('#networkGraph')
        .attr('width', width)
        .attr('height', height);
    
    // 줌 기능 추가
    const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', function(event) {
            g.attr('transform', event.transform);
        });
    
    svg.call(zoom);
    
    // 그래프 그룹 생성
    g = svg.append('g');
    
    // 화살표 마커 정의
    svg.append('defs').append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 15)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#30363d');
}

// 드래그 오버 처리
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

// 드래그 리브 처리
function handleDragLeave(e) {
    e.currentTarget.classList.remove('dragover');
}

// 드롭 처리
function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

// 파일 선택 처리
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

// 파일 처리
async function processFile(file) {
    if (!file.name.match(/\.(md|markdown|txt)$/i)) {
        alert('마크다운 파일(.md, .markdown, .txt)만 업로드 가능합니다.');
        return;
    }
    
    showLoading();
    
    try {
        const formData = new FormData();
        formData.append('markdown', file);
        
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('파일 업로드에 실패했습니다.');
        }
        
        const data = await response.json();
        currentData = data;
        
        hideLoading();
        showVisualization();
        createNetworkVisualization(data);
        
    } catch (error) {
        hideLoading();
        alert('파일 처리 중 오류가 발생했습니다: ' + error.message);
    }
}

// 로딩 표시
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

// 로딩 숨김
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// 시각화 섹션 표시
function showVisualization() {
    document.getElementById('uploadSection').style.display = 'none';
    document.getElementById('visualizationSection').style.display = 'grid';
}

// 업로드 섹션 표시
function showUploadSection() {
    document.getElementById('uploadSection').style.display = 'flex';
    document.getElementById('visualizationSection').style.display = 'none';
    
    // 기존 시각화 정리
    if (simulation) {
        simulation.stop();
    }
    if (g) {
        g.selectAll('*').remove();
    }
    
    currentData = null;
    selectedNode = null;
    
    // 파일 입력 초기화
    document.getElementById('fileInput').value = '';
}

// 네트워크 시각화 생성
function createNetworkVisualization(data) {
    if (!data.nodes || data.nodes.length === 0) {
        alert('시각화할 노드가 없습니다.');
        return;
    }
    
    const container = document.querySelector('.graph-container');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // 기존 시각화 제거
    g.selectAll('*').remove();
    
    // 시뮬레이션 설정
    const nodeSize = parseInt(document.getElementById('nodeSize').value);
    const linkDistance = parseInt(document.getElementById('linkDistance').value);
    const charge = parseInt(document.getElementById('charge').value);
    
    simulation = d3.forceSimulation(data.nodes)
        .force('link', d3.forceLink(data.links).id(d => d.id).distance(linkDistance))
        .force('charge', d3.forceManyBody().strength(charge))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(nodeSize + 2));
    
    // 링크 생성
    const link = g.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(data.links)
        .enter().append('line')
        .attr('class', 'link')
        .attr('marker-end', 'url(#arrowhead)');
    
    // 노드 그룹 생성
    const nodeGroup = g.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(data.nodes)
        .enter().append('g')
        .attr('class', 'node-group')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));
    
    // 노드 원 생성
    const node = nodeGroup.append('circle')
        .attr('class', 'node')
        .attr('r', d => {
            // 노드 타입에 따른 크기 조정
            const baseSize = nodeSize;
            switch(d.type) {
                case 'heading': return baseSize + (6 - d.level) * 2;
                case 'tag': return baseSize * 0.8;
                default: return baseSize;
            }
        })
        .attr('fill', d => nodeColors[d.type] || nodeColors.default)
        .attr('stroke', '#30363d')
        .attr('stroke-width', 2)
        .on('click', handleNodeClick)
        .on('mouseover', handleNodeMouseOver)
        .on('mouseout', handleNodeMouseOut);
    
    // 노드 라벨 생성
    const label = nodeGroup.append('text')
        .attr('class', 'node-label')
        .attr('dy', d => {
            const baseSize = nodeSize;
            const radius = d.type === 'heading' ? baseSize + (6 - d.level) * 2 : 
                          d.type === 'tag' ? baseSize * 0.8 : baseSize;
            return radius + 15;
        })
        .text(d => {
            // 라벨 길이 제한
            const maxLength = 15;
            return d.label.length > maxLength ? 
                   d.label.substring(0, maxLength) + '...' : d.label;
        });
    
    // 시뮬레이션 틱 이벤트
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        
        nodeGroup
            .attr('transform', d => `translate(${d.x},${d.y})`);
    });
    
    // 첫 번째 노드 정보 표시
    if (data.nodes.length > 0) {
        updateNodeInfo(data.nodes[0]);
    }
}

// 노드 클릭 처리
function handleNodeClick(event, d) {
    event.stopPropagation();
    
    // 이전 선택 해제
    g.selectAll('.node').classed('selected', false);
    g.selectAll('.link').classed('highlighted', false);
    
    // 현재 노드 선택
    d3.select(event.currentTarget).classed('selected', true);
    selectedNode = d;
    
    // 연결된 링크 하이라이트
    g.selectAll('.link')
        .classed('highlighted', link => 
            link.source.id === d.id || link.target.id === d.id);
    
    updateNodeInfo(d);
}

// 노드 마우스 오버 처리
function handleNodeMouseOver(event, d) {
    d3.select(event.currentTarget)
        .transition()
        .duration(200)
        .attr('r', function() {
            const currentRadius = parseFloat(d3.select(this).attr('r'));
            return currentRadius * 1.2;
        });
}

// 노드 마우스 아웃 처리
function handleNodeMouseOut(event, d) {
    d3.select(event.currentTarget)
        .transition()
        .duration(200)
        .attr('r', d => {
            const baseSize = parseInt(document.getElementById('nodeSize').value);
            switch(d.type) {
                case 'heading': return baseSize + (6 - d.level) * 2;
                case 'tag': return baseSize * 0.8;
                default: return baseSize;
            }
        });
}

// 노드 정보 업데이트
function updateNodeInfo(node) {
    const nodeInfo = document.getElementById('nodeInfo');
    
    const typeNames = {
        'heading': '제목',
        'wiki-link': '위키링크',
        'external-link': '외부링크',
        'tag': '태그'
    };
    
    let html = `
        <h4>${node.label}</h4>
        <div class="node-type">${typeNames[node.type] || '기본'}</div>
        <p><strong>ID:</strong> ${node.id}</p>
    `;
    
    if (node.type === 'heading' && node.level) {
        html += `<p><strong>레벨:</strong> H${node.level}</p>`;
    }
    
    if (node.url) {
        html += `<p><strong>URL:</strong> <a href="${node.url}" target="_blank" style="color: var(--accent-primary);">${node.url}</a></p>`;
    }
    
    // 연결된 노드 정보
    if (currentData && currentData.links) {
        const connectedNodes = currentData.links
            .filter(link => link.source.id === node.id || link.target.id === node.id)
            .map(link => link.source.id === node.id ? link.target : link.source)
            .filter((node, index, self) => self.findIndex(n => n.id === node.id) === index);
        
        if (connectedNodes.length > 0) {
            html += `<h4>연결된 노드 (${connectedNodes.length}개)</h4>`;
            connectedNodes.forEach(connectedNode => {
                html += `<p>• ${connectedNode.label || connectedNode.id}</p>`;
            });
        }
    }
    
    nodeInfo.innerHTML = html;
}

// 드래그 시작
function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

// 드래그 중
function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}

// 드래그 종료
function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

// 시각화 업데이트
function updateVisualization() {
    if (!currentData || !simulation) return;
    
    const nodeSize = parseInt(document.getElementById('nodeSize').value);
    const linkDistance = parseInt(document.getElementById('linkDistance').value);
    const charge = parseInt(document.getElementById('charge').value);
    
    // 시뮬레이션 힘 업데이트
    simulation
        .force('link').distance(linkDistance)
        .force('charge').strength(charge)
        .force('collision').radius(nodeSize + 2)
        .alpha(0.3)
        .restart();
    
    // 노드 크기 업데이트
    g.selectAll('.node')
        .attr('r', d => {
            switch(d.type) {
                case 'heading': return nodeSize + (6 - d.level) * 2;
                case 'tag': return nodeSize * 0.8;
                default: return nodeSize;
            }
        });
    
    // 라벨 위치 업데이트
    g.selectAll('.node-label')
        .attr('dy', d => {
            const radius = d.type === 'heading' ? nodeSize + (6 - d.level) * 2 : 
                          d.type === 'tag' ? nodeSize * 0.8 : nodeSize;
            return radius + 15;
        });
}

// 시각화 리셋
function resetVisualization() {
    if (!currentData) return;
    
    // 컨트롤 값 초기화
    document.getElementById('nodeSize').value = 8;
    document.getElementById('linkDistance').value = 100;
    document.getElementById('charge').value = -200;
    
    // 선택 해제
    g.selectAll('.node').classed('selected', false);
    g.selectAll('.link').classed('highlighted', false);
    selectedNode = null;
    
    // 시각화 재생성
    createNetworkVisualization(currentData);
}

// 윈도우 리사이즈 처리
window.addEventListener('resize', function() {
    if (svg && currentData) {
        const container = document.querySelector('.graph-container');
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        svg.attr('width', width).attr('height', height);
        
        if (simulation) {
            simulation.force('center', d3.forceCenter(width / 2, height / 2));
            simulation.alpha(0.3).restart();
        }
    }
}); 