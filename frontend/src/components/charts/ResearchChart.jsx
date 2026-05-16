import Plot from 'react-plotly.js'

export default function ResearchChart({ dates, prices, symbol }) {
  if (!dates || !prices || dates.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="font-mono text-sm text-terminal-muted">No data available</p>
      </div>
    )
  }

  const firstPrice = prices[0]
  const lastPrice = prices[prices.length - 1]
  const totalReturn = ((lastPrice - firstPrice) / firstPrice) * 100

  const trace = {
    x: dates,
    y: prices,
    type: 'scatter',
    mode: 'lines',
    line: {
      color: '#3b82f6',
      width: 2,
    },
    fill: 'tozeroy',
    fillcolor: 'rgba(59, 130, 246, 0.1)',
    hovertemplate: '<b>%{x}</b><br>Price: $%{y:.2f}<extra></extra>',
  }

  const layout = {
    paper_bgcolor: '#0a0a0a',
    plot_bgcolor: '#0a0a0a',
    font: { color: '#9ca3af', family: 'monospace' },
    margin: { t: 40, r: 50, b: 50, l: 60 },
    xaxis: {
      gridcolor: '#1f2937',
      showgrid: true,
      zeroline: false,
      showspikes: true,
      spikemode: 'across',
      spikesnap: 'cursor',
      spikethickness: 1,
      spikedash: 'solid',
      spikecolor: '#9ca3af',
    },
    yaxis: {
      gridcolor: '#1f2937',
      showgrid: true,
      zeroline: false,
      showspikes: true,
      spikemode: 'across',
      spikesnap: 'cursor',
      spikethickness: 1,
      spikedash: 'solid',
      spikecolor: '#9ca3af',
    },
    showlegend: false,
    annotations: [
      {
        x: 0.02,
        y: 0.98,
        xref: 'paper',
        yref: 'paper',
        text: `${symbol}`,
        showarrow: false,
        font: {
          size: 14,
          color: '#ffffff',
          family: 'monospace',
        },
        xanchor: 'left',
        yanchor: 'top',
      },
      {
        x: 0.98,
        y: 0.98,
        xref: 'paper',
        yref: 'paper',
        text: `Total Return: ${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}%`,
        showarrow: false,
        font: {
          size: 12,
          color: totalReturn >= 0 ? '#22c55e' : '#ef4444',
          family: 'monospace',
        },
        xanchor: 'right',
        yanchor: 'top',
      },
    ],
  }

  const config = {
    responsive: true,
    displayModeBar: false,
    scrollZoom: true,
  }

  return (
    <Plot
      data={[trace]}
      layout={layout}
      config={config}
      style={{ width: '100%', height: '300px' }}
      useResizeHandler
    />
  )
}
