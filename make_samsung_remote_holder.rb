# Ruby exporter for the print-ready STL. Units: millimetres.
triangles = []
def quad(ts, a, b, c, d)
  ts << [a,b,c] << [a,c,d]
end
def box(ts, x0,x1,y0,y1,z0,z1)
  p = [[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],
       [x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]]
  quad(ts,p[0],p[3],p[2],p[1]); quad(ts,p[4],p[5],p[6],p[7])
  quad(ts,p[0],p[1],p[5],p[4]); quad(ts,p[1],p[2],p[6],p[5])
  quad(ts,p[2],p[3],p[7],p[6]); quad(ts,p[3],p[0],p[4],p[7])
end

# A rounded rectangular plate with a rounded through-window. The slab is one
# continuous piece of material around the opening, rather than separate panels.
def rounded_loop(cx, cy, width, height, radius, segments)
  corners = [[cx + width/2-radius, cy + height/2-radius, 0],
             [cx - width/2+radius, cy + height/2-radius, 90],
             [cx - width/2+radius, cy - height/2+radius, 180],
             [cx + width/2-radius, cy - height/2+radius, 270]]
  corners.flat_map do |x, y, start|
    (0...segments).map do |i|
      angle = (start + i * 90.0 / segments) * Math::PI / 180
      [x + radius*Math.cos(angle), y + radius*Math.sin(angle)]
    end
  end
end
def rounded_plate_with_window(ts, width, height, radius, thickness, window_width, window_height, window_radius)
  # Multiple inset layers form real curved fillets around the top and bottom
  # perimeter edges—not merely rounded plan-view corners.
  fillet = 3.0
  layers = [[0.0, fillet], [0.5, 1.5], [1.5, 0.4], [3.0, 0.0],
            [thickness-3.0, 0.0], [thickness-1.5, 0.4],
            [thickness-0.5, 1.5], [thickness, fillet]]
  outer_layers = layers.map do |z, inset|
    rounded_loop(0, 0, width-2*inset, height-2*inset, radius-inset, 8).map { |x,y| [x,y,z] }
  end
  inner = rounded_loop(0, 0, window_width, window_height, window_radius, 8)
  count = inner.length
  outer_bottom = outer_layers.first; outer_top = outer_layers.last
  inner_bottom = inner.map { |x,y| [x,y,0] }; inner_top = inner.map { |x,y| [x,y,thickness] }
  count.times do |i|
    j = (i + 1) % count
    quad(ts, inner_bottom[j], inner_bottom[i], inner_top[i], inner_top[j])
    quad(ts, outer_bottom[i], inner_bottom[i], inner_bottom[j], outer_bottom[j])
    quad(ts, outer_top[j], inner_top[j], inner_top[i], outer_top[i])
  end
  (0...outer_layers.length-1).each do |level|
    lower = outer_layers[level]; upper = outer_layers[level+1]
    count.times do |i|
      j = (i + 1) % count
      quad(ts, lower[i], lower[j], upper[j], upper[i])
    end
  end
end

# Monolithic-looking, thick rounded block: 70 x 165 x 10 mm, with all outside
# perimeter edges filleted by 3 mm.
# A rounded 32 x 114 mm window leaves the SolarCell panel fully exposed.
rounded_plate_with_window(triangles,70,165,10,10,32,114,4)

# The integrated recessed bay holds the remote. Every rail overlaps the block,
# so it slices as one connected case; the remote slides in from the open top.
box(triangles,-27,-23,-74,70,8,20)      # left wall
box(triangles,23,27,-74,70,8,20)        # right wall
box(triangles,-27,27,-74,-70,8,20)      # lower stop
box(triangles,-27,-21,-74,70,14,20)     # left front retaining lip
box(triangles,21,27,-74,70,14,20)       # right front retaining lip
box(triangles,-27,27,-74,-68,14,20)     # lower front retaining lip

def normal(a,b,c)
  u = b.zip(a).map { |x,y| x-y }; v = c.zip(a).map { |x,y| x-y }
  n = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]]
  length = Math.sqrt(n.sum { |v| v*v }); n.map { |v| v / length }
end
File.open('samsung_qled_solar_remote_openback_sleeve.stl', 'w') do |file|
  file.puts 'solid samsung_qled_remote_holder'
  triangles.each do |a,b,c|
    file.puts "  facet normal #{normal(a,b,c).map { |v| format('%.6f',v) }.join(' ')}"
    file.puts '    outer loop'
    [a,b,c].each { |p| file.puts "      vertex #{p.map { |v| format('%.6f',v) }.join(' ')}" }
    file.puts '    endloop'; file.puts '  endfacet'
  end
  file.puts 'endsolid samsung_qled_remote_holder'
end
puts "Wrote STL with #{triangles.length} triangles."
